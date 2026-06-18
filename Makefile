.PHONY: all build assets html js clean

SRC_DIR := src
BUILD_DIR := public

ASSETS_DIR := $(SRC_DIR)/assets
HTML_DIR := $(SRC_DIR)/html
JS_DIR := $(SRC_DIR)/js

HTML_SRC := $(wildcard $(HTML_DIR)/*.html)
HTML_DST := $(BUILD_DIR)/index.html \
			$(patsubst $(HTML_DIR)/%.html, $(BUILD_DIR)/%/index.html, \
				$(filter-out $(HTML_DIR)/index.html, $(HTML_SRC)))

all: build

build: assets html js

html: $(HTML_DST)

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

$(BUILD_DIR)/index.html: $(HTML_DIR)/index.html
	@./scripts/build.sh $< $@
	@echo "[HTML] $< -> $@"

$(BUILD_DIR)/%/index.html: $(HTML_DIR)/%.html
	@mkdir -p $(dir $@)
	@./scripts/build.sh $< $@
	@echo "[HTML] $< -> $@"

js:
	@echo "[JSs] Syncing..."
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
	@echo "[JSs] done."

clean:
	rm -rf $(BUILD_DIR)/
