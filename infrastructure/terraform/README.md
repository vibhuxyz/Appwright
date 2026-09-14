# infrastructure/terraform/

Reserved. No cloud account or GPU host is provisioned yet, so there is nothing for Terraform to
declare state for. Add modules here once a real target (a Postgres instance, a GPU node pool)
needs to exist outside a developer's laptop — see `infrastructure/k8s/README.md` for the same
reasoning.
