# About

This repository is responsible for dumping of development data from production database to docker image which will be pushed to Digital Ocean Container Registry using Github actions. This allows us to pull image from CR and reuse it with `docker-compose`. This process is invoked on every sunday, by push event to main branch or by any other event defined in [publish-image.yaml](.github/workflows/publish-image.yaml).

# Docs

- [how to download db](docs/how-to-download-dev-db.md)

# Further development

We can define more data by adjusting dump.mjs command and mask sensitive data

---

- by [@JurajZovinec](https://github.com/Jurajzovinec)
