.PHONY: install build dev lint test check clean

install:
	bun install

dev:
	bun run tauri dev

build:
	bun run tauri build

lint:
	bun run lint
	cargo clippy --manifest-path src-tauri/Cargo.toml

test:
	bun run test
	cargo test --manifest-path src-tauri/Cargo.toml

check:
	cargo check --manifest-path src-tauri/Cargo.toml

clean:
	rm -rf dist/
	cargo clean --manifest-path src-tauri/Cargo.toml
