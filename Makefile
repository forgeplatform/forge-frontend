## UI_NEXT_DIR: Relative path to the directory containing this Makefile
UI_NEXT_DIR := $(patsubst %/,%,$(dir $(lastword $(MAKEFILE_LIST))))

.PHONY: ui-next
## Default build target — builds Forail UI
ui-next: $(UI_NEXT_DIR)/build

$(UI_NEXT_DIR)/build: $(UI_NEXT_DIR)/node_modules $(shell find $(UI_NEXT_DIR)/src -type f 2>/dev/null) $(UI_NEXT_DIR)/index.html $(UI_NEXT_DIR)/vite.config.ts
	@echo "=== Building Forail UI ==="
	@cd $(UI_NEXT_DIR) && npm run build
	@echo "=== Done building Forail UI ==="

$(UI_NEXT_DIR)/node_modules: $(UI_NEXT_DIR)/package.json $(UI_NEXT_DIR)/package-lock.json
	@echo "=== Installing dependencies ==="
	@cd $(UI_NEXT_DIR) && npm ci
	@touch $@

.PHONY: clean/ui-next
## Clean build artifacts and dependencies
clean/ui-next:
	rm -rf $(UI_NEXT_DIR)/build $(UI_NEXT_DIR)/node_modules

.PHONY: $(UI_NEXT_DIR)/clean
## Alias for clean/ui-next
$(UI_NEXT_DIR)/clean: clean/ui-next
