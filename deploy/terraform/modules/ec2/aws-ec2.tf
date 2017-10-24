variable "instance_type" {}

variable "name" {}

variable "vpc_id" {}

variable "key_name" {
  description = "The SSH public key name (in EC2 key-pairs) to be injected into instances"
}

variable "asg_maximum_number_of_instances" {
  description = "The maximum number of instances the ASG should maintain"
}

variable "asg_minimum_number_of_instances" {
  description = "The minimum number of instances the ASG should maintain"
}

variable "load_balancer_name" {
  description = "The ELB the ASG should associate with"
}

variable "subnet_ids" {
    type    = "list"
    default = []
}

variable "build_env" {}

data "aws_ami" "datascope" {
  most_recent = true
  filter {
    name = "name"
    values = ["datascope-backend-${var.build_env}*"]
  }
  owners = ["844297601570"]
}

resource "aws_launch_configuration" "launch_config" {
  image_id = "${data.aws_ami.datascope.id}"
  instance_type = "${var.instance_type}"
  key_name = "${var.key_name}"
  security_groups = ["${aws_security_group.allow_all.name}"]
  name = "${var.name}-${var.build_env}-${data.aws_ami.datascope.id}"

  root_block_device {
    delete_on_termination = true
    volume_type = "gp2"
    volume_size = 64
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_group" "main_asg" {
  # interpolate the LC into the ASG name so it always forces an update
  name = "datascope-backend-${var.build_env}-asg-${data.aws_ami.datascope.id}"

  # We want this to explicitly depend on the launch config above
  depends_on = ["aws_launch_configuration.launch_config"]

  vpc_zone_identifier = ["${var.subnet_ids}"]

  # Uses the ID from the launch config created above
  launch_configuration = "${aws_launch_configuration.launch_config.id}"

  max_size = "${var.asg_maximum_number_of_instances}"
  min_size = "${var.asg_minimum_number_of_instances}"

  health_check_grace_period = "300"
  health_check_type = "ELB"

  load_balancers = ["${var.load_balancer_name}"]

  wait_for_elb_capacity = "${var.asg_minimum_number_of_instances}"

  tag {
    key = "environment"
    value = "${var.build_env}"
    propagate_at_launch = true
  }

  tag {
    key = "Name"
    value = "datascope-backend-${var.build_env}"
    propagate_at_launch = true
  }

  tag {
    key = "Client"
    value = "WBG"
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_policy" "scale_up" {
  name = "${aws_autoscaling_group.main_asg.name}-scale-up"
  scaling_adjustment = 1
  adjustment_type = "ChangeInCapacity"
  cooldown = 300
  autoscaling_group_name = "${aws_autoscaling_group.main_asg.name}"
}

resource "aws_cloudwatch_metric_alarm" "latency_high" {
    alarm_name = "${var.load_balancer_name}-latency-high"
    comparison_operator = "GreaterThanOrEqualToThreshold"
    evaluation_periods = "2"
    metric_name = "Latency"
    namespace = "AWS/ELB"
    period = "120"
    statistic = "Average"
    threshold = "0.5"
    dimensions {
        LoadBalancerName = "${var.load_balancer_name}"
    }
    alarm_description = "This metric monitors high ec2 elb latency"
    alarm_actions = ["${aws_autoscaling_policy.scale_up.arn}"]
}

resource "aws_autoscaling_policy" "scale_down" {
  name = "${aws_autoscaling_group.main_asg.name}-scale-down"
  scaling_adjustment = -1
  adjustment_type = "ChangeInCapacity"
  cooldown = 300
  autoscaling_group_name = "${aws_autoscaling_group.main_asg.name}"
}

resource "aws_cloudwatch_metric_alarm" "latency_low" {
    alarm_name = "${var.load_balancer_name}-latency-low"
    comparison_operator = "LessThanOrEqualToThreshold"
    evaluation_periods = "2"
    metric_name = "Latency"
    namespace = "AWS/ELB"
    period = "120"
    statistic = "Average"
    threshold = "0.25"
    dimensions {
        LoadBalancerName = "${var.load_balancer_name}"
    }
    alarm_description = "This metric monitors low ec2 elb latency"
    alarm_actions = ["${aws_autoscaling_policy.scale_down.arn}"]
}

resource "aws_cloudwatch_metric_alarm" "cpu_utilization_high" {
  alarm_name          = "${aws_autoscaling_group.main_asg.name}-cpu-utilization-high"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "70"

  dimensions {
    AutoScalingGroupName = "${aws_autoscaling_group.main_asg.name}"
  }

  alarm_description = "This metric monitors ec2 cpu utilization"
  alarm_actions     = ["${aws_autoscaling_policy.scale_up.arn}", "arn:aws:sns:us-west-2:844297601570:datascope", "arn:aws:sns:us-west-2:844297601570:datascope-alerts"]
}

resource "aws_security_group" "allow_all" {
  name        = "allow_all"
  description = "Allow all inbound traffic"
  vpc_id      = "${var.vpc_id}"

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port       = 0
    to_port         = 0
    protocol        = "-1"
    cidr_blocks     = ["0.0.0.0/0"]
  }
}
