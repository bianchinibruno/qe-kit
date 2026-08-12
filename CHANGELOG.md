# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/), and the project adheres to
[Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-08-12

First complete release: the six roadmap skills plus `abrir-pr`, all demonstrated against the
`sandbox-cobranca` example.

### Added

- `revisao-pr-multiagente` — six disjoint review lenses in parallel (correção, contrato, teste,
  dados-estado, segurança, simplificação), deduplicated and ranked by severity.
- `testes-de-integracao` — maps real integration points, writes tests, and proves each one fails when
  the code is wrong; core assertion thesis in `references/assercoes.md`.
- `cobertura-de-criterios` — traceability matrix crossing acceptance criteria with the suite.
- `diagnostico-de-performance` — k6 load test with interpretation and bottleneck-signature catalogue.
- `autoria-de-testes-api` — derives API test cases from the contract, with a contract-drift map.
- `colecao-api` — generates a versionable Bruno API collection from source.
- `abrir-pr` — opens a pull request from branch commits in the house format.
- `examples/sandbox-cobranca` — billing API with three planted bugs and a vacuous test suite, target
  of every skill's demonstration.
- Hygiene guards (`check-leaks.sh`, `check-skills.sh`) enforced in CI.
- `evals/` — trigger evals focused on near-misses between sibling skills.
