variable "name" {}

variable "subnet_ids" {
    type    = "list"
    default = []
}

# Create a new load balancer
resource "aws_elb" "default" {
  name    = "${var.name}-elb"
  subnets = ["${var.subnet_ids}"]

  listener {
    instance_port     = 8000
    instance_protocol = "http"
    lb_port           = 80
    lb_protocol       = "http"
  }

  health_check {
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 3
    target              = "HTTP:8000/"
    interval            = 30
  }

  cross_zone_load_balancing   = true
  idle_timeout                = 400
  connection_draining         = true
  connection_draining_timeout = 400

  tags {
    Name = "${var.name}-elb"
  }
}

output "elb_name" { value = "${aws_elb.default.name}" }