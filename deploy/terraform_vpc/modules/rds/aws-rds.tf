variable "name" {}

variable "subnet_ids" {
    type    = "list"
    default = []
}

resource "aws_db_instance" "default" {
  allocated_storage    = 10
  storage_type         = "gp2"
  engine               = "postgres"
  engine_version       = "9.6"
  instance_class       = "db.t2.small"
  name                 = "auth"
  username             = "amida"
  password             = "bluebutton"
  db_subnet_group_name = "${aws_db_subnet_group.default.name}"
  multi_az             = true
  skip_final_snapshot  = true
  tags {
      Name = "${var.name}-rds"
  }
}

resource "aws_db_subnet_group" "default" {
  name       = "main"
  subnet_ids = ["${var.subnet_ids}"]
  tags {
    Name = "${var.name}-db-subnet-group"
  }
}

output "address"  { value = "${aws_db_instance.default.address}" }
output "endpoint" { value = "${aws_db_instance.default.endpoint}" }
output "id"       { value = "${aws_db_instance.default.id}" }
output "name"     { value = "${aws_db_instance.default.name}" }