/**
 * FF Typescript/React Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import * as path from "path";
import * as moduleAlias from "module-alias";

moduleAlias.addAliases({
    "@ff/browser": path.resolve(__dirname, "../exports"),
    "@ff/core": path.resolve(__dirname, "../../../core/dist/exports"),
});

// define vars on node global object (usually done by Webpack)
global["ENV_DEVELOPMENT"] = false;
global["ENV_PRODUCTION"] = true;
global["ENV_VERSION"] = "Test";

////////////////////////////////////////////////////////////////////////////////

suite("FF Browser", function() {
    // no tests
});
