/* https://developer.mozilla.org/en-US/docs/Glossary/Base64 */
function b64ToUint6(nChr) {
  return nChr > 64 && nChr < 91
    ? nChr - 65
    : nChr > 96 && nChr < 123
    ? nChr - 71
    : nChr > 47 && nChr < 58
    ? nChr + 4
    : nChr === 43
    ? 62
    : nChr === 47
    ? 63
    : 0;
}

function base64DecToArr(sBase64, nBlocksSize) {
  const sB64Enc = sBase64.replace(/[^A-Za-z0-9+/]/g, "");
  const nInLen = sB64Enc.length;
  const nOutLen = nBlocksSize
    ? Math.ceil(((nInLen * 3 + 1) >> 2) / nBlocksSize) * nBlocksSize
    : (nInLen * 3 + 1) >> 2;
  const taBytes = new Uint8Array(nOutLen);

  let nMod3;
  let nMod4;
  let nUint24 = 0;
  let nOutIdx = 0;
  for (let nInIdx = 0; nInIdx < nInLen; nInIdx++) {
    nMod4 = nInIdx & 3;
    nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << (6 * (3 - nMod4));
    if (nMod4 === 3 || nInLen - nInIdx === 1) {
      nMod3 = 0;
      while (nMod3 < 3 && nOutIdx < nOutLen) {
        taBytes[nOutIdx] = (nUint24 >>> ((16 >>> nMod3) & 24)) & 255;
        nMod3++;
        nOutIdx++;
      }
      nUint24 = 0;
    }
  }

  return taBytes;
}

/* Base64 string to array encoding */
function uint6ToB64(nUint6) {
  return nUint6 < 26
    ? nUint6 + 65
    : nUint6 < 52
    ? nUint6 + 71
    : nUint6 < 62
    ? nUint6 - 4
    : nUint6 === 62
    ? 43
    : nUint6 === 63
    ? 47
    : 65;
}

function base64EncArr(aBytes) {
  let nMod3 = 2;
  let sB64Enc = "";

  const nLen = aBytes.length;
  let nUint24 = 0;
  for (let nIdx = 0; nIdx < nLen; nIdx++) {
    nMod3 = nIdx % 3;
    if (nIdx > 0 && ((nIdx * 4) / 3) % 76 === 0) {
      sB64Enc += "\r\n";
    }

    nUint24 |= aBytes[nIdx] << ((16 >>> nMod3) & 24);
    if (nMod3 === 2 || aBytes.length - nIdx === 1) {
      sB64Enc += String.fromCodePoint(
        uint6ToB64((nUint24 >>> 18) & 63),
        uint6ToB64((nUint24 >>> 12) & 63),
        uint6ToB64((nUint24 >>> 6) & 63),
        uint6ToB64(nUint24 & 63)
      );
      nUint24 = 0;
    }
  }
  return (
    sB64Enc.substr(0, sB64Enc.length - 2 + nMod3) +
    (nMod3 === 2 ? "" : nMod3 === 1 ? "=" : "==")
  );
}

/* UTF-8 array to JS string and vice versa */

function UTF8ArrToStr(aBytes) {
  let sView = "";
  let nPart;
  const nLen = aBytes.length;
  for (let nIdx = 0; nIdx < nLen; nIdx++) {
    nPart = aBytes[nIdx];
    sView += String.fromCodePoint(
      nPart > 251 && nPart < 254 && nIdx + 5 < nLen /* six bytes */
        ? /* (nPart - 252 << 30) may be not so safe in ECMAScript! So…: */
          (nPart - 252) * 1073741824 +
            ((aBytes[++nIdx] - 128) << 24) +
            ((aBytes[++nIdx] - 128) << 18) +
            ((aBytes[++nIdx] - 128) << 12) +
            ((aBytes[++nIdx] - 128) << 6) +
            aBytes[++nIdx] -
            128
        : nPart > 247 && nPart < 252 && nIdx + 4 < nLen /* five bytes */
        ? ((nPart - 248) << 24) +
          ((aBytes[++nIdx] - 128) << 18) +
          ((aBytes[++nIdx] - 128) << 12) +
          ((aBytes[++nIdx] - 128) << 6) +
          aBytes[++nIdx] -
          128
        : nPart > 239 && nPart < 248 && nIdx + 3 < nLen /* four bytes */
        ? ((nPart - 240) << 18) +
          ((aBytes[++nIdx] - 128) << 12) +
          ((aBytes[++nIdx] - 128) << 6) +
          aBytes[++nIdx] -
          128
        : nPart > 223 && nPart < 240 && nIdx + 2 < nLen /* three bytes */
        ? ((nPart - 224) << 12) +
          ((aBytes[++nIdx] - 128) << 6) +
          aBytes[++nIdx] -
          128
        : nPart > 191 && nPart < 224 && nIdx + 1 < nLen /* two bytes */
        ? ((nPart - 192) << 6) + aBytes[++nIdx] - 128
        : /* nPart < 127 ? */ /* one byte */
          nPart
    );
  }
  return sView;
}

function strToUTF8Arr(sDOMStr) {
  let aBytes;
  let nChr;
  const nStrLen = sDOMStr.length;
  let nArrLen = 0;

  /* mapping… */
  for (let nMapIdx = 0; nMapIdx < nStrLen; nMapIdx++) {
    nChr = sDOMStr.codePointAt(nMapIdx);

    if (nChr >= 0x10000) {
      nMapIdx++;
    }

    nArrLen +=
      nChr < 0x80
        ? 1
        : nChr < 0x800
        ? 2
        : nChr < 0x10000
        ? 3
        : nChr < 0x200000
        ? 4
        : nChr < 0x4000000
        ? 5
        : 6;
  }

  aBytes = new Uint8Array(nArrLen);

  /* transcription… */
  let nIdx = 0;
  let nChrIdx = 0;
  while (nIdx < nArrLen) {
    nChr = sDOMStr.codePointAt(nChrIdx);
    if (nChr < 128) {
      /* one byte */
      aBytes[nIdx++] = nChr;
    } else if (nChr < 0x800) {
      /* two bytes */
      aBytes[nIdx++] = 192 + (nChr >>> 6);
      aBytes[nIdx++] = 128 + (nChr & 63);
    } else if (nChr < 0x10000) {
      /* three bytes */
      aBytes[nIdx++] = 224 + (nChr >>> 12);
      aBytes[nIdx++] = 128 + ((nChr >>> 6) & 63);
      aBytes[nIdx++] = 128 + (nChr & 63);
    } else if (nChr < 0x200000) {
      /* four bytes */
      aBytes[nIdx++] = 240 + (nChr >>> 18);
      aBytes[nIdx++] = 128 + ((nChr >>> 12) & 63);
      aBytes[nIdx++] = 128 + ((nChr >>> 6) & 63);
      aBytes[nIdx++] = 128 + (nChr & 63);
      nChrIdx++;
    } else if (nChr < 0x4000000) {
      /* five bytes */
      aBytes[nIdx++] = 248 + (nChr >>> 24);
      aBytes[nIdx++] = 128 + ((nChr >>> 18) & 63);
      aBytes[nIdx++] = 128 + ((nChr >>> 12) & 63);
      aBytes[nIdx++] = 128 + ((nChr >>> 6) & 63);
      aBytes[nIdx++] = 128 + (nChr & 63);
      nChrIdx++;
    } /* if (nChr <= 0x7fffffff) */ else {
      /* six bytes */
      aBytes[nIdx++] = 252 + (nChr >>> 30);
      aBytes[nIdx++] = 128 + ((nChr >>> 24) & 63);
      aBytes[nIdx++] = 128 + ((nChr >>> 18) & 63);
      aBytes[nIdx++] = 128 + ((nChr >>> 12) & 63);
      aBytes[nIdx++] = 128 + ((nChr >>> 6) & 63);
      aBytes[nIdx++] = 128 + (nChr & 63);
      nChrIdx++;
    }
    nChrIdx++;
  }

  return aBytes;
}

let randomSalt = () => window.crypto.getRandomValues(new Uint8Array(16))

let hash = data => window.crypto.subtle.digest("SHA-256", data)

let encodeText = text => (new TextEncoder()).encode(text)
let decodeText = text => (new TextDecoder()).decode(text)

let encodePassword = password => {
	return window.crypto.subtle.importKey(
		"raw",
		encodeText(password),
		"PBKDF2",
		false,
		["deriveBits", "deriveKey"],
	)
}

let arraysEqual = (left, right) => {
	if (left.length != right.length) return false

	return left.reduce(
		(acc, lbyte, i) => acc & (lbyte === right[i]),
		true
	)
}

let saltedCrypto = async (password_salt, password) => {
	let encoded = await encodePassword(password)

	let key = await window.crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			hash: "SHA-256",
			salt: password_salt,
			iterations: 1024,
		},
		encoded,
		{
			name: "AES-CTR",
			length: 128,
		},
		false,
		["encrypt", "decrypt"],
	)

	function Crypt() {
		this.encrypt = async plaintext => {
			let encoded = encodeText(plaintext)
			let counter = randomSalt()
			return {
				password_salt: password_salt,
				counter: counter,
				ciphertext: new Uint8Array(
					await window.crypto.subtle.encrypt(
						{
							name: "AES-CTR",
							counter: counter,
							length: 64,
						},
						key,
						encoded
					)
				),
				digest: new Uint8Array(await hash(encoded)),
			}
		}

		this.decrypt = async (ciphertext, counter, digest) => {
			let plaintext = await window.crypto.subtle.decrypt(
				{
					name: "AES-CTR",
					counter: counter,
					length: 64,
				},
				key,
				ciphertext
			)
			let decoded = decodeText(new Uint8Array(plaintext))

			let check = new Uint8Array(await hash(plaintext))
			if (arraysEqual(check, digest)) {
				return decoded
			} else {
				return null
			}
		}
	}

	return new Crypt(key)
}

let randomCrypto = async password => {
	return await saltedCrypto(randomSalt(), password)
}

// Initialise the decrypt form
let initDecrypt = async root => {
	let url = new URL(window.location.href)

	let name = url.searchParams.get("name")
	let decode = base64DecToArr
	let password_salt = decode(url.searchParams.get("password_salt"))
	let ciphertext = decode(url.searchParams.get("ciphertext"))
	let counter = decode(url.searchParams.get("counter"))
	let digest = decode(url.searchParams.get("digest"))

	if (name === null) return

	// Show the name
	root.querySelectorAll(".link-name").forEach(element => {
		element.innerText = name
	})

	let password = root.querySelector("#password")

	let onUpdate = async event => {
		let crypto = await saltedCrypto(password_salt, password.value)
		let plaintext = await crypto.decrypt(
			ciphertext,
			counter,
			digest
		)

		if (plaintext !== null) {
			window.location.href = plaintext
		}
	}

	password.addEventListener('input', onUpdate)
}

// Initialise the encrypt form
let initEncrypt = async root => {
	let name = root.querySelector("#name")
	let title = root.querySelector("#title")
	let url = root.querySelector("#url")
	let password = root.querySelector("#key")
	let toml = root.querySelector("#encrypted")

	onUpdate = async event => {
		let crypto = await randomCrypto(password.value)
		let encrypted = await crypto.encrypt(url.value)

		let targetUrl = new URL(window.location)
		targetUrl.hash = ""
		targetUrl.sarch = null

		let setParam = (key, value) => {
			targetUrl.searchParams.set(key, base64EncArr(value))
		}
		targetUrl.searchParams.set("name", name.value)
		setParam("password_salt", encrypted.password_salt)
		setParam("ciphertext", encrypted.ciphertext)
		setParam("counter", encrypted.counter)
		setParam("digest", encrypted.digest)

		let quote = text => text.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")
		toml.innerText = `["${quote(name.value)}"]
title=\"${quote(title.value)}\"
url=\"${quote(targetUrl.href)}\"
index=false`
	}


	name.addEventListener('input', onUpdate)
	title.addEventListener('input', onUpdate)
	url.addEventListener('input', onUpdate)
	password.addEventListener('input', onUpdate)

	await onUpdate()
}

// Handle window load
window.addEventListener('load', async event => {
	await initDecrypt(document.querySelector('#decrypt'))
	await initEncrypt(document.querySelector('#encrypt'))
})
