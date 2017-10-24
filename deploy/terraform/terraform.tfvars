vpc = {
    tag         = "amida-services"
    cidr_block  = "10.0.0.0/20"
    subnet_bits = "4"
}
key_name        = "amida-dev-17"
instance_type   = "t2.micro"
enc_domain = {
    name        = "amida-services.com"
}
enc_domain_int  = "amida-services.internal"
app = {
    name = "amida-auth-service"
}
build_env = "stage"