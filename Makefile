.PHONY: all build assets html clean

SRC_DIR := src
BUILD_DIR := public

ASSETS_DIR := $(SRC_DIR)/assets
HTML_DIR := $(SRC_DIR)/html
JS_DIR := $(SRC_DIR)/js

all: build

build: assets html js

assets:
	@echo "[ASSETS] Syncing..."
	@mkdir -p $(BUILD_DIR)
	@for i in "$(ASSETS_DIR)"/*; do \
		[ -e "$$i" ] || continue; \
		name=$$(basename "$$i"); \
		echo "-> $$name"; \
		if [ -d "$$i" ]; then \
			mkdir -p "$(BUILD_DIR)/$$name"; \
			rsync -ai --delete "$$i"/ "$(BUILD_DIR)/$$name"/; \
		else \
			rsync -ai "$$i" "$(BUILD_DIR)/"; \
		fi; \
	done
	@echo "[ASSETS] done."

html:
	@for i in "$(HTML_DIR)"/*; do \
		[ -e "$$i" ] || continue; \
		name=$$(basename "$$i"); \
		echo  "-> $$name"; \
		if [ -d "$$i" ]; then \
			mkdir -p "$(BUILD_DIR)/$$name"; \
			rsync -ai --delete "$$i"/ "$(BUILD_DIR)/$$name"/; \
		else \
			rsync -ai "$$i" "$(BUILD_DIR)/"; \
		fi; \
	done

js:
	@mkdir -p $(BUILD_DIR)/js
	@for i in "$(JS_DIR)"/*; do \
		[ -e "$$i" ] || continue; \
		name=$$(basename "$$i"); \
		echo  "-> $$name"; \
		if [ -d "$$i" ]; then \
			mkdir -p "$(BUILD_DIR)/js/$$name"; \
			rsync -ai --delete "$$i"/ "$(BUILD_DIR)/js/$$name"/; \
		else \
			rsync -ai "$$i" "$(BUILD_DIR)/js/"; \
		fi; \
	done

clean:
	rm -rf $(BUILD_DIR)/
