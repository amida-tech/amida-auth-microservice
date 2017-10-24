# VPC setup

module "vpc" {
    source      = "./modules/vpc"
    provider    = "${var.provider}"
    name        = "${var.vpc["tag"]}"
    region      = "${var.provider["region"]}"
    cidr        = "${var.vpc["cidr_block"]}"
    zones       = ["${split(",", lookup(var.azs, var.provider["region"]))}"]
    env         = "production"
    domain_int  = "${var.enc_domain_int}"
}

module "public-subnets" {
    source      = "./modules/subnets"
    tag         = "${var.vpc["tag"]}"
    region      = "${var.provider["region"]}"
    cidr        = "${var.vpc["cidr_block"]}"
    subnet_bits = "${var.vpc["subnet_bits"]}"
    zones       = ["${split(",", lookup(var.azs, var.provider["region"]))}"]
    env         = "production"
    type        = "public"
    vpc_id      = "${module.vpc.vpc_id}"
    public_ip   = "true"
}

module "private-subnets-ec2" {
    source       = "./modules/subnets"
    tag          = "${var.vpc["tag"]}"
    region       = "${var.provider["region"]}"
    cidr         = "${var.vpc["cidr_block"]}"
    subnet_bits  = "${var.vpc["subnet_bits"]}"
    subnet_start = "1"
    zones        = ["${split(",", lookup(var.azs, var.provider["region"]))}"]
    env          = "production"
    type         = "private"
    vpc_id       = "${module.vpc.vpc_id}"
}

module "private-subnets-rds" {
    source       = "./modules/subnets"
    tag          = "${var.vpc["tag"]}"
    region       = "${var.provider["region"]}"
    cidr         = "${var.vpc["cidr_block"]}"
    subnet_bits  = "${var.vpc["subnet_bits"]}"
    subnet_start = "2"
    zones        = ["${split(",", lookup(var.azs, var.provider["region"]))}"]
    env          = "production"
    type         = "private"
    vpc_id       = "${module.vpc.vpc_id}"
}

module "nat" {
    source       = "./modules/nat"
    zones        = ["${split(",", lookup(var.azs, var.provider["region"]))}"]
    subnet_ids   = ["${module.public-subnets.subnet_ids}"]
}

module "public-subnets-rt" {
    source       = "./modules/routes/public"
    vpc_id       = "${module.vpc.vpc_id}"
    igw          = "${module.vpc.igw_id}"
    tag          = "${var.vpc["tag"]}"
    zones        = ["${split(",", lookup(var.azs, var.provider["region"]))}"]
    subnet_ids   = ["${module.public-subnets.subnet_ids}"]
}

module "private-subnets-ec2-rt" {
    source          = "./modules/routes/private"
    vpc_id          = "${module.vpc.vpc_id}"
    tag             = "${var.vpc["tag"]}"
    #zones           = ["${data.aws_availability_zones.available.names}"]
    zones           = ["${split(",", lookup(var.azs, var.provider["region"]))}"]
    nat_gateway_ids = ["${module.nat.nat_gateway_ids}"]
    subnet_ids      = ["${module.private-subnets-ec2.subnet_ids}"]
}

module "private-subnets-rds-rt" {
    source          = "./modules/routes/private"
    vpc_id          = "${module.vpc.vpc_id}"
    tag             = "${var.vpc["tag"]}"
    #zones           = ["${data.aws_availability_zones.available.names}"]
    zones           = ["${split(",", lookup(var.azs, var.provider["region"]))}"]
    nat_gateway_ids = ["${module.nat.nat_gateway_ids}"]
    subnet_ids      = ["${module.private-subnets-rds.subnet_ids}"]
}

module "bastion" {
    source        = "./modules/bastion"
    tag           = "${var.vpc["tag"]}"
    region        = "${var.provider["region"]}"
    cidr          = "${var.vpc["cidr_block"]}"
    zones         = ["${split(",", lookup(var.azs, var.provider["region"]))}"]
    image         = "${data.aws_ami.ubuntu-xenial.id}"
    key_name      = "${var.key_name}"
    instance_type = "${var.instance_type}"
    vpc_id        = "${module.vpc.vpc_id}"
    subnet_ids    = ["${module.public-subnets.subnet_ids}"]
    zone_id       = "${module.vpc.route53_zone}"
    domain        = "${lower(var.vpc["tag"])}.${var.enc_domain_int}"
}

output "vpc_id" { value = "${module.vpc.vpc_id}" }
output "igw_id" { value = "${module.vpc.igw_id}" }
output "vpc_cidr" { value = "${module.vpc.vpc_cidr}" }
output "route53_zone" { value = "${module.vpc.route53_zone}" }
output "vpc_zones" { value = "${join(",", data.aws_availability_zones.available.names)}" }

output "public_subnets"    { value = "${join(",", module.public-subnets.subnet_ids)}" }
output "private_subnets_ec2"   { value = "${join(",", module.private-subnets-ec2.subnet_ids)}" }
output "private_subnets_rds" { value = "${join(",", module.private-subnets-rds.subnet_ids)}" }

output "nat_gateway_ids" { value = "${join(",", module.nat.nat_gateway_ids)}" }

output "public_subnets_rt_id"     { value = "${module.public-subnets-rt.public_subnets_rt_id}" }
output "private_subnets_ec2_rt_ids"   { value = "${join(",", module.private-subnets-ec2-rt.private_subnets_rt_ids)}" }
output "private_subnets_rds_rt_ids" { value = "${join(",", module.private-subnets-rds-rt.private_subnets_rt_ids)}" }

output "bastion_sg_id"   { value = "${module.bastion.bastion_sg_id}" }
output "bastion_asg_id"  { value = "${module.bastion.bastion_asg_id}" }
output "bastion_lc_id"   { value = "${module.bastion.bastion_lc_id}" }
output "bastion_iam_arn" { value = "${module.bastion.bastion_iam_arn}" }

# Application setup

module "rds" {
    source     = "./modules/rds"
    name       = "${var.app["name"]}"
    subnet_ids = ["${module.private-subnets-rds.subnet_ids}"]
}

module "ec2" {
    source        = "./modules/ec2"
    name          = "${var.app["name"]}"
    key_name      = "${var.key_name}"
    build_env     = "${var.build_env}"
    vpc_id        = "${module.vpc.vpc_id}"
    subnet_ids    = ["${module.private-subnets-ec2.subnet_ids}"]
    instance_type = "m3.medium"
    asg_minimum_number_of_instances = "1"
    asg_maximum_number_of_instances = "2"
    load_balancer_name              = "${module.elb.elb_name}"
}

module "elb" {
    source     = "./modules/elb"
    name       = "${var.app["name"]}"
    subnet_ids = ["${module.private-subnets-rds.subnet_ids}"]
}