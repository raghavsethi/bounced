// Possibly this should be checked more.
function generateNewKey() {
    x = Date.now();
    x ^= (x << 21);
    x ^= (x >>> 35);
    x ^= (x << 4);
    return x*x;
}

// Will fail if we can handle multiple transfers in under a millisecond.
function generateNewId() {
    x = Date.now();
    return x;
}

exports.generateNewKey = generateNewKey;
exports.generateNewId = generateNewId;