COFFEE=node_modules/.bin/coffee
MOCHA=node_modules/.bin/mocha

all: clean setup test check-checkout-clean

build:
	$(COFFEE) -cbo lib src
	@./node_modules/.bin/npub prep lib

prepublish:
	./node_modules/.bin/npub prep

clean:
	rm -rf lib
	rm -rf node_modules

test: build
	$(MOCHA)

release: all
	git push --tags origin HEAD:master
	npm publish

setup:
	npm install

# This will fail if there are unstaged changes in the checkout
check-checkout-clean:
	git diff --exit-code
