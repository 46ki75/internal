#!/bin/bash

set -u -e -o pipefail

sudo apt-get update -y
sudo apt-get install vim -y

# GitHub CLI
sudo apt install gh

# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

# Node.js (Volta)
curl https://get.volta.sh | bash

# Terraform
sudo apt-get install -y gnupg software-properties-common

wget -O- https://apt.releases.hashicorp.com/gpg |
    gpg --dearmor |
    sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg >/dev/null

echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] \
https://apt.releases.hashicorp.com $(lsb_release -cs) main" |
    sudo tee /etc/apt/sources.list.d/hashicorp.list

sudo apt-get update -y
sudo apt-get install terraform -y

# AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "/tmp/awscliv2.zip"
unzip /tmp/awscliv2.zip -d /tmp
sudo /tmp/aws/install

mkdir -p ~/.aws
cat <<EOF >> ~/.aws/config
[profile internal]
sso_session = internal
sso_account_id = 891377368344
sso_role_name = AdministratorAccess
region = ap-northeast-1
output = json

[sso-session internal]
sso_start_url = https://46ki75.awsapps.com/start/
sso_region = ap-northeast-1
sso_registration_scopes = sso:account:access
EOF

# starship
curl -sS https://starship.rs/install.sh | sh -s -- --yes
echo 'eval "$(starship init bash)"' >>~/.bashrc
