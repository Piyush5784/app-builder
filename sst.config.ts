/// <reference path="./.sst/platform/config.d.ts" />

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export default $config({
  app(input) {
    return {
      name: "app-builder",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    const vpc = new sst.aws.Vpc("app-builder-vpc");

    const securityGroup = new aws.ec2.SecurityGroup("app-builder-server-sg", {
      vpcId: vpc.id,
      ingress: [
        {
          protocol: "tcp",
          fromPort: 22,
          toPort: 22,
          cidrBlocks: ["0.0.0.0/0"],
        },
        {
          protocol: "tcp",
          fromPort: 3001,
          toPort: 3001,
          cidrBlocks: ["0.0.0.0/0"],
        },
      ],
      egress: [
        { protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] },
      ],
    });

    const keyPair = new aws.ec2.KeyPair("app-builder-server-key", {
      publicKey: requireEnv("EC2_SSH_PUBLIC_KEY"),
    });

    const ubuntu = aws.ec2.getAmiOutput({
      mostRecent: true,
      owners: ["099720109477"],
      filters: [
        {
          name: "name",
          values: ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"],
        },
      ],
    });

    const userData = `#!/bin/bash
          set -euo pipefail

          curl -fsSL https://bun.sh/install | bash
          ln -sf /root/.bun/bin/bun /usr/local/bin/bun

          mkdir -p /opt/app-builder

          cat > /etc/systemd/system/app-builder-server.service <<'UNIT'
          [Unit]
          Description=app-builder server
          After=network.target

          [Service]
          Type=simple
          WorkingDirectory=/opt/app-builder
          EnvironmentFile=/opt/app-builder/.env
          ExecStart=/usr/local/bin/bun /opt/app-builder/index.js
          Restart=on-failure
          RestartSec=5

          [Install]
          WantedBy=multi-user.target
          UNIT

          systemctl daemon-reload
          systemctl enable app-builder-server
        `;  

    const instance = new aws.ec2.Instance("app-builder-server", {
      ami: ubuntu.id,
      instanceType: "t3.micro",
      subnetId: vpc.publicSubnets.apply((subnets) => subnets[0]!),
      vpcSecurityGroupIds: [securityGroup.id],
      keyName: keyPair.keyName,
      associatePublicIpAddress: true,
      userData,
      tags: { Name: "app-builder-server" },
    });

    return {
      publicIp: instance.publicIp,
    };
  },
});
