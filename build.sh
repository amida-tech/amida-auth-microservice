#!/bin/bash -x

# Setup temp directories
rm -rf build node_modules
mkdir build
INSTALL_DIR=$(mktemp -d build/XXXX)

POSTGRES_SERVER_RPM=postgresql96-server-9.6.10-1PGDG.rhel7.x86_64.rpm
POSTGRES_SERVER_URL=https://yum.postgresql.org/9.6/redhat/rhel-7-x86_64/$POSTGRES_SERVER_RPM
POSTGRES_LIB_RPM=postgresql96-libs-9.6.10-1PGDG.rhel7.x86_64.rpm
POSTGRES_LIB_URL=https://yum.postgresql.org/9.6/redhat/rhel-7-x86_64/$POSTGRES_LIB_RPM

POSTGRES_DATA_DIR=$INSTALL_DIR/var/lib/pgsql/9.6/data
POSTGRES_SOCK_DIR=$INSTALL_DIR/var/run/postgresql

NODE_VERSION=8.12.0
NODE_DIR_NAME=node-v$NODE_VERSION-linux-x64
NODE_TAR_NAME=$NODE_DIR_NAME.tar.xz
NODE_URL=https://nodejs.org/dist/v$NODE_VERSION/$NODE_TAR_NAME

# Install dependencies
cd $INSTALL_DIR

# PostgreSQL
wget -q $POSTGRES_SERVER_URL
rpm2cpio $POSTGRES_SERVER_RPM | cpio -di

wget -q $POSTGRES_LIB_URL
rpm2cpio $POSTGRES_LIB_RPM | cpio -di

export LD_LIBRARY_PATH=$PWD/usr/pgsql-9.6/lib/:$LD_LIBRARY_PATH
export PATH=$PWD/usr/pgsql-9.6/bin/:$PATH

# # Node
wget -q $NODE_URL
tar -xf $NODE_TAR_NAME
export PATH=$PWD/$NODE_DIR_NAME/bin:$PATH

# Yarn
npm --prefix . install yarn@1.9.4
export PATH=$PWD/node_modules/yarn/bin:$PATH

cd -

# Start Postgres
initdb -D $POSTGRES_DATA_DIR -U amida
pg_ctl -D $POSTGRES_DATA_DIR -o "-h 127.0.0.1 -k $PWD/$POSTGRES_SOCK_DIR" start

yarn
cp .env.example .env.test
yarn test

# Cleanup
rm -rf build node_modules
