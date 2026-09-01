resource "aws_vpc" "main" {
  cidr_block           = var.cidr
  enable_dns_hostnames   = true
  enable_dns_support     = true
  instance_tenancy       = "default"
  tags = {
    Name = "${var.name}-vpc"
    Environment = var.environment
  }
}

resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.cidr, 2, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  tags = {
    Name = "${var.name}-public-subnet-${count.index}"
    Type = "public"
  }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags = {
    Name = "${var.name}-igw"
  }
}

route_table "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "${var.name}-public-rt"
  }
}

subnet_route_table_association "public" {
  count             = length(aws_subnet.public)
  subnet_id         = aws_subnet.public[count.index].id
  route_table_id    = route_table.public.id
}

data "aws_availability_zones" "available" {
  state = "available"
}