// Available field types
const FIELD_TYPES = [
  "u8",
  "u16",
  "u32",
  "u64",
  "u128",
  "i8",
  "i16",
  "i32",
  "i64",
  "i128",
  "bool",
  "publicKey",
  "string",
  "bytes",
];

// Create dropdown HTML for field types
function createFieldTypeOptions() {
  return FIELD_TYPES.map(
    (type) => `<option value="${type}">${type}</option>`
  ).join("");
}

// Switch between tabs
function switchTab(tabId) {
  // Hide all tab contents
  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active");
  });

  // Deactivate all tabs
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.remove("active");
  });

  // Activate selected tab
  document.getElementById(tabId).classList.add("active");

  // Find and activate the tab button
  const tabIndex = tabId === "decode-tab" ? 0 : 1;
  document.querySelectorAll(".tab")[tabIndex].classList.add("active");

  // Hide errors
  document.querySelectorAll(".error").forEach((error) => {
    error.style.display = "none";
  });

  // Hide results
  document.querySelectorAll(".result").forEach((result) => {
    result.style.display = "none";
  });

  // Update encode values if switching to encode tab
  if (tabId === "encode-tab") {
    updateEncodeInputs();
  }
}

// Generate an Anchor discriminator from an instruction name
async function generateAnchorDiscriminator(instructionName) {
  // In Anchor, instruction discriminators are generated from the
  // first 8 bytes of the SHA-256 hash of "global:<snake_case_name>"

  // 1. Convert PascalCase or camelCase to snake_case
  const snakeCase = instructionName
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "");

  // 2. Create the preimage string with namespace prefix
  const preimage = `global:${snakeCase}`;

  // 3. Compute SHA-256 hash
  const encoder = new TextEncoder();
  const data = encoder.encode(preimage);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  // 4. Take first 8 bytes as discriminator
  const hashArray = new Uint8Array(hashBuffer);
  return hashArray.slice(0, 8);
}

// Toggle the instruction name input based on Anchor checkbox
function toggleAnchorInstructionName() {
  const showInstructionName =
    document.getElementById("encodeWithAnchor").checked;
  const instructionNameContainer = document.getElementById(
    "anchorInstructionNameContainer"
  );

  if (instructionNameContainer) {
    instructionNameContainer.style.display = showInstructionName
      ? "block"
      : "none";
  }
}

// Modal functions
function openTransactionModal() {
  document.getElementById("transaction-modal").style.display = "block";
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

// Close modal when clicking outside of it
window.onclick = function (event) {
  if (event.target.className === "modal") {
    event.target.style.display = "none";
  }
};

// Add a new field row
function addField() {
  const fieldContainer = document.getElementById("fieldContainer");
  const fieldRow = document.createElement("div");
  fieldRow.className = "field-row";
  fieldRow.innerHTML = `
            <div class="field-name">
                <input type="text" class="field-name-input" placeholder="Field name">
            </div>
            <div class="field-type">
                <select class="field-type-select">
                    ${createFieldTypeOptions()}
                </select>
            </div>
            <button class="btn-small" onclick="removeField(this)">✕</button>
        `;
  fieldContainer.appendChild(fieldRow);

  // Update encode inputs if we're on the encode tab
  if (document.getElementById("encode-tab").classList.contains("active")) {
    updateEncodeInputs();
  }
}

// Remove a field row
function removeField(button) {
  const fieldContainer = document.getElementById("fieldContainer");
  if (fieldContainer.children.length > 1) {
    button.parentElement.remove();

    // Update encode inputs if we're on the encode tab
    if (document.getElementById("encode-tab").classList.contains("active")) {
      updateEncodeInputs();
    }
  }
}

// Toggle between hex and base58 input mode
function toggleInputMode() {
  const isBase58 = document.getElementById("isBase58").checked;
  const dataInputLabel = document.getElementById("dataInputLabel");
  const dataInput = document.getElementById("dataInput");

  if (isBase58) {
    dataInputLabel.textContent = "Base58 Encoded Data";
    dataInput.placeholder = "Enter base58 encoded data";
  } else {
    dataInputLabel.textContent = "Raw Transaction Data (hex)";
    dataInput.placeholder =
      "Enter raw transaction data (hex format without 0x prefix)";
  }
}

// Convert a hex string to a Uint8Array
function hexToBytes(hex) {
  // Remove whitespace and 0x prefix
  hex = hex.replace(/\s+/g, "").replace(/^0x/i, "");

  // Must have even number of digits
  if (hex.length % 2 !== 0) {
    throw new Error("Hex string must have an even number of digits");
  }

  const bytes = new Uint8Array(hex.length / 2);

  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }

  return bytes;
}

// Convert a Uint8Array to a hex string
function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Update encode input fields based on the current data structure
function updateEncodeInputs() {
  const encodeValuesContainer = document.getElementById(
    "encodeValuesContainer"
  );
  encodeValuesContainer.innerHTML = "";

  // Get field definitions
  const fieldRows = document.querySelectorAll(".field-row");

  for (const row of fieldRows) {
    const nameInput = row.querySelector(".field-name-input");
    const typeSelect = row.querySelector(".field-type-select");

    const fieldName = nameInput.value.trim();
    const fieldType = typeSelect.value;

    // Skip if the field has no name
    if (!fieldName) continue;

    // Create input for this field
    const valueRow = document.createElement("div");
    valueRow.className = "value-row";

    // Different input based on type
    let inputHtml;

    switch (fieldType) {
      case "bool":
        inputHtml = `
                        <select class="value-input" data-field="${fieldName}" data-type="${fieldType}">
                            <option value="false">false</option>
                            <option value="true">true</option>
                        </select>
                    `;
        break;

      case "publicKey":
        inputHtml = `<input type="text" class="value-input" data-field="${fieldName}" data-type="${fieldType}" placeholder="Enter a valid Solana public key">`;
        break;

      case "string":
        inputHtml = `<input type="text" class="value-input" data-field="${fieldName}" data-type="${fieldType}" placeholder="Enter text">`;
        break;

      case "bytes":
        inputHtml = `<input type="text" class="value-input" data-field="${fieldName}" data-type="${fieldType}" placeholder="Enter hex bytes (without 0x)">`;
        break;

      default:
        // For number types
        if (fieldType.startsWith("u") || fieldType.startsWith("i")) {
          inputHtml = `<input type="text" class="value-input" data-field="${fieldName}" data-type="${fieldType}" placeholder="Enter a number">`;
        } else {
          inputHtml = `<input type="text" class="value-input" data-field="${fieldName}" data-type="${fieldType}">`;
        }
    }

    valueRow.innerHTML = `
                <div class="value-name">
                    ${fieldName} (${fieldType}):
                </div>
                <div class="value-input-wrapper">
                    ${inputHtml}
                </div>
            `;

    encodeValuesContainer.appendChild(valueRow);
  }
}

// Decode data according to the defined schema
function decodeData() {
  try {
    // Clear previous results and errors
    document.getElementById("decode-result").style.display = "none";
    document.getElementById("decode-error").style.display = "none";

    // Get input data
    const dataInput = document.getElementById("dataInput").value.trim();
    if (!dataInput) {
      showDecodeError("Please enter transaction data");
      return;
    }

    // Convert input to bytes
    let bytes;
    try {
      if (document.getElementById("isBase58").checked) {
        bytes = Base58.decode(dataInput);
      } else {
        bytes = hexToBytes(dataInput);
      }
    } catch (e) {
      showDecodeError(`Invalid input format: ${e.message}`);
      return;
    }

    // Check if we need to handle an Anchor discriminator
    const isAnchorProgram = document.getElementById("isAnchorProgram").checked;
    let offset = 0;

    if (isAnchorProgram) {
      // Skip the 8-byte discriminator
      offset = 8;

      // Log discriminator for debugging
      const discriminator = bytes.slice(0, 8);
      console.log("Anchor Discriminator:", bytesToHex(discriminator));
    }

    // Get field definitions
    const fields = [];
    const fieldRows = document.querySelectorAll(".field-row");

    for (const row of fieldRows) {
      const nameInput = row.querySelector(".field-name-input");
      const typeSelect = row.querySelector(".field-type-select");

      const fieldName = nameInput.value.trim();
      const fieldType = typeSelect.value;

      if (!fieldName) {
        showDecodeError("All fields must have a name");
        return;
      }

      fields.push({ name: fieldName, type: fieldType });
    }

    if (fields.length === 0) {
      showDecodeError("Please define at least one field");
      return;
    }

    // Decode each field
    const result = {};

    for (const field of fields) {
      const { name, type } = field;

      // Check if we have enough bytes left
      if (offset >= bytes.length) {
        showDecodeError(`Not enough data to decode field '${name}'`);
        return;
      }

      // Decode based on type
      switch (type) {
        case "u8":
          result[name] = bytes[offset];
          offset += 1;
          break;

        case "u16":
          result[name] = new DataView(
            bytes.buffer,
            bytes.byteOffset + offset,
            2
          ).getUint16(0, true);
          offset += 2;
          break;

        case "u32":
          result[name] = new DataView(
            bytes.buffer,
            bytes.byteOffset + offset,
            4
          ).getUint32(0, true);
          offset += 4;
          break;

        case "u64":
          // Handle u64 as a BigInt
          const lo = new DataView(
            bytes.buffer,
            bytes.byteOffset + offset,
            4
          ).getUint32(0, true);
          const hi = new DataView(
            bytes.buffer,
            bytes.byteOffset + offset + 4,
            4
          ).getUint32(0, true);
          result[name] = (BigInt(hi) << BigInt(32)) | BigInt(lo);
          offset += 8;
          break;

        case "u128":
          // Handle u128 as a BigInt
          let u128 = BigInt(0);
          for (let i = 0; i < 16; i++) {
            u128 = u128 | (BigInt(bytes[offset + i]) << BigInt(i * 8));
          }
          result[name] = u128;
          offset += 16;
          break;

        case "i8":
          result[name] = new DataView(
            bytes.buffer,
            bytes.byteOffset + offset,
            1
          ).getInt8(0);
          offset += 1;
          break;

        case "i16":
          result[name] = new DataView(
            bytes.buffer,
            bytes.byteOffset + offset,
            2
          ).getInt16(0, true);
          offset += 2;
          break;

        case "i32":
          result[name] = new DataView(
            bytes.buffer,
            bytes.byteOffset + offset,
            4
          ).getInt32(0, true);
          offset += 4;
          break;

        case "i64":
          // Handle i64 as a BigInt
          const i64lo = new DataView(
            bytes.buffer,
            bytes.byteOffset + offset,
            4
          ).getUint32(0, true);
          const i64hi = new DataView(
            bytes.buffer,
            bytes.byteOffset + offset + 4,
            4
          ).getInt32(0, true);
          result[name] = (BigInt(i64hi) << BigInt(32)) | BigInt(i64lo);
          offset += 8;
          break;

        case "i128":
          // Handle i128 as a BigInt
          let i128 = BigInt(0);
          for (let i = 0; i < 15; i++) {
            i128 = i128 | (BigInt(bytes[offset + i]) << BigInt(i * 8));
          }
          // Handle sign bit separately
          const signByte = bytes[offset + 15];
          if (signByte & 0x80) {
            // Negative number
            i128 = i128 | (BigInt(signByte & 0x7f) << BigInt(120));
            i128 = -(BigInt(1) << BigInt(127)) + i128;
          } else {
            i128 = i128 | (BigInt(signByte) << BigInt(120));
          }
          result[name] = i128;
          offset += 16;
          break;

        case "bool":
          result[name] = bytes[offset] !== 0;
          offset += 1;
          break;

        case "publicKey":
          // Read 32 bytes and convert to base58
          const pubkeyBytes = bytes.slice(offset, offset + 32);
          result[name] = Base58.encode(pubkeyBytes);
          offset += 32;
          break;

        case "string":
          // Read length prefix (u32)
          const stringLength = new DataView(
            bytes.buffer,
            bytes.byteOffset + offset,
            4
          ).getUint32(0, true);
          offset += 4;

          // Read string bytes
          const stringBytes = bytes.slice(offset, offset + stringLength);
          result[name] = new TextDecoder().decode(stringBytes);
          offset += stringLength;
          break;

        case "bytes":
          // Read length prefix (u32)
          const bytesLength = new DataView(
            bytes.buffer,
            bytes.byteOffset + offset,
            4
          ).getUint32(0, true);
          offset += 4;

          // Read bytes
          const bytesData = bytes.slice(offset, offset + bytesLength);
          result[name] = bytesToHex(bytesData);
          offset += bytesLength;
          break;

        default:
          showDecodeError(`Unsupported field type: ${type}`);
          return;
      }
    }

    // Display the result
    const resultContent = document.getElementById("decode-result-content");
    resultContent.textContent = JSON.stringify(
      result,
      (key, value) => {
        // Convert BigInts to strings for display
        if (typeof value === "bigint") {
          return value.toString();
        }
        return value;
      },
      2
    );

    document.getElementById("decode-result").style.display = "block";
  } catch (error) {
    console.error("Decoding error:", error);
    showDecodeError(`Error decoding data: ${error.message}`);
  }
}

// Encode data according to the defined schema with proper Anchor discriminator
async function encodeData() {
  try {
    // Clear previous results and errors
    document.getElementById("encode-result").style.display = "none";
    document.getElementById("encode-error").style.display = "none";

    // Get field definitions
    const fields = [];
    const fieldRows = document.querySelectorAll(".field-row");

    for (const row of fieldRows) {
      const nameInput = row.querySelector(".field-name-input");
      const typeSelect = row.querySelector(".field-type-select");

      const fieldName = nameInput.value.trim();
      const fieldType = typeSelect.value;

      if (!fieldName) {
        showEncodeError("All fields must have a name");
        return;
      }

      fields.push({ name: fieldName, type: fieldType });
    }

    if (fields.length === 0) {
      showEncodeError("Please define at least one field");
      return;
    }

    // Check if we should include an Anchor discriminator
    const includeAnchor = document.getElementById("encodeWithAnchor").checked;

    // Get the instruction name if using Anchor
    let instructionName = "";
    if (includeAnchor) {
      instructionName = document
        .getElementById("anchorInstructionName")
        .value.trim();
      if (!instructionName) {
        showEncodeError("Please enter an instruction name for Anchor program");
        return;
      }
    }

    // Calculate total byte length needed
    let totalLength = 0;
    if (includeAnchor) {
      totalLength += 8; // 8 bytes for the discriminator
    }

    // First pass: validate inputs and calculate size
    const fieldValues = {};

    for (const field of fields) {
      const { name, type } = field;

      // Find the corresponding input
      const input = document.querySelector(
        `.value-input[data-field="${name}"]`
      );
      if (!input) {
        showEncodeError(`Could not find input for field '${name}'`);
        return;
      }

      const value = input.value.trim();

      // Validate and prepare the value
      try {
        switch (type) {
          case "u8":
            const u8Value = parseInt(value);
            if (isNaN(u8Value) || u8Value < 0 || u8Value > 255) {
              throw new Error(`Invalid u8 value for '${name}': must be 0-255`);
            }
            fieldValues[name] = u8Value;
            totalLength += 1;
            break;

          case "u16":
            const u16Value = parseInt(value);
            if (isNaN(u16Value) || u16Value < 0 || u16Value > 65535) {
              throw new Error(
                `Invalid u16 value for '${name}': must be 0-65535`
              );
            }
            fieldValues[name] = u16Value;
            totalLength += 2;
            break;

          case "u32":
            const u32Value = parseInt(value);
            if (isNaN(u32Value) || u32Value < 0 || u32Value > 4294967295) {
              throw new Error(
                `Invalid u32 value for '${name}': must be 0-4294967295`
              );
            }
            fieldValues[name] = u32Value;
            totalLength += 4;
            break;

          case "u64":
            const u64Value = BigInt(value);
            if (u64Value < 0 || u64Value > BigInt("18446744073709551615")) {
              throw new Error(`Invalid u64 value for '${name}'`);
            }
            fieldValues[name] = u64Value;
            totalLength += 8;
            break;

          case "u128":
            const u128Value = BigInt(value);
            if (
              u128Value < 0 ||
              u128Value > BigInt("340282366920938463463374607431768211455")
            ) {
              throw new Error(`Invalid u128 value for '${name}'`);
            }
            fieldValues[name] = u128Value;
            totalLength += 16;
            break;

          case "i8":
            const i8Value = parseInt(value);
            if (isNaN(i8Value) || i8Value < -128 || i8Value > 127) {
              throw new Error(
                `Invalid i8 value for '${name}': must be -128 to 127`
              );
            }
            fieldValues[name] = i8Value;
            totalLength += 1;
            break;

          case "i16":
            const i16Value = parseInt(value);
            if (isNaN(i16Value) || i16Value < -32768 || i16Value > 32767) {
              throw new Error(
                `Invalid i16 value for '${name}': must be -32768 to 32767`
              );
            }
            fieldValues[name] = i16Value;
            totalLength += 2;
            break;

          case "i32":
            const i32Value = parseInt(value);
            if (
              isNaN(i32Value) ||
              i32Value < -2147483648 ||
              i32Value > 2147483647
            ) {
              throw new Error(
                `Invalid i32 value for '${name}': must be -2147483648 to 2147483647`
              );
            }
            fieldValues[name] = i32Value;
            totalLength += 4;
            break;

          case "i64":
            const i64Value = BigInt(value);
            if (
              i64Value < BigInt("-9223372036854775808") ||
              i64Value > BigInt("9223372036854775807")
            ) {
              throw new Error(`Invalid i64 value for '${name}'`);
            }
            fieldValues[name] = i64Value;
            totalLength += 8;
            break;

          case "i128":
            const i128Value = BigInt(value);
            if (
              i128Value < BigInt("-170141183460469231731687303715884105728") ||
              i128Value > BigInt("170141183460469231731687303715884105727")
            ) {
              throw new Error(`Invalid i128 value for '${name}'`);
            }
            fieldValues[name] = i128Value;
            totalLength += 16;
            break;

          case "bool":
            fieldValues[name] = value === "true";
            totalLength += 1;
            break;

          case "publicKey":
            if (!value || value.length < 32 || value.length > 44) {
              throw new Error(`Invalid public key for '${name}'`);
            }

            try {
              const pubkeyBytes = Base58.decode(value);
              if (pubkeyBytes.length !== 32) {
                throw new Error("Invalid public key length");
              }
              fieldValues[name] = value;
              totalLength += 32;
            } catch (e) {
              throw new Error(`Invalid public key for '${name}': ${e.message}`);
            }
            break;

          case "string":
            const stringBytes = new TextEncoder().encode(value);
            fieldValues[name] = value;
            totalLength += 4 + stringBytes.length; // 4 bytes length prefix + string data
            break;

          case "bytes":
            // Remove whitespace from hex string
            const cleanHex = value.replace(/\s+/g, "");
            // Check if it's valid hex
            if (!/^[0-9a-fA-F]*$/.test(cleanHex)) {
              throw new Error(`Invalid hex for '${name}'`);
            }
            // Must have even number of digits
            if (cleanHex.length % 2 !== 0) {
              throw new Error(
                `Hex string for '${name}' must have an even number of digits`
              );
            }
            fieldValues[name] = cleanHex;
            totalLength += 4 + cleanHex.length / 2; // 4 bytes length prefix + data length
            break;

          default:
            throw new Error(`Unsupported field type: ${type}`);
        }
      } catch (e) {
        showEncodeError(e.message);
        return;
      }
    }

    // Create the output buffer
    const result = new Uint8Array(totalLength);
    let offset = 0;

    // Add discriminator if needed
    if (includeAnchor) {
      try {
        // Generate the actual discriminator based on the instruction name
        const discriminator = await generateAnchorDiscriminator(
          instructionName
        );
        result.set(discriminator, 0);
        offset += 8;
      } catch (error) {
        showEncodeError(
          `Error generating Anchor discriminator: ${error.message}`
        );
        return;
      }
    }

    // Second pass: encode values
    for (const field of fields) {
      const { name, type } = field;
      const value = fieldValues[name];

      switch (type) {
        case "u8":
          result[offset] = value;
          offset += 1;
          break;

        case "u16":
          new DataView(result.buffer).setUint16(offset, value, true);
          offset += 2;
          break;

        case "u32":
          new DataView(result.buffer).setUint32(offset, value, true);
          offset += 4;
          break;

        case "u64":
          // Write as little-endian bytes
          for (let i = 0; i < 8; i++) {
            result[offset + i] = Number(
              (value >> BigInt(i * 8)) & BigInt(0xff)
            );
          }
          offset += 8;
          break;

        case "u128":
          // Write as little-endian bytes
          for (let i = 0; i < 16; i++) {
            result[offset + i] = Number(
              (value >> BigInt(i * 8)) & BigInt(0xff)
            );
          }
          offset += 16;
          break;

        case "i8":
          new DataView(result.buffer).setInt8(offset, value);
          offset += 1;
          break;

        case "i16":
          new DataView(result.buffer).setInt16(offset, value, true);
          offset += 2;
          break;

        case "i32":
          new DataView(result.buffer).setInt32(offset, value, true);
          offset += 4;
          break;

        case "i64":
          // Handle negative numbers properly
          for (let i = 0; i < 8; i++) {
            result[offset + i] = Number(
              (value >> BigInt(i * 8)) & BigInt(0xff)
            );
          }
          offset += 8;
          break;

        case "i128":
          // Handle negative numbers properly
          for (let i = 0; i < 16; i++) {
            result[offset + i] = Number(
              (value >> BigInt(i * 8)) & BigInt(0xff)
            );
          }
          offset += 16;
          break;

        case "bool":
          result[offset] = value ? 1 : 0;
          offset += 1;
          break;

        case "publicKey":
          const pubkeyBytes = Base58.decode(value);
          result.set(pubkeyBytes, offset);
          offset += 32;
          break;

        case "string":
          const stringBytes = new TextEncoder().encode(value);
          // Write length prefix (u32)
          new DataView(result.buffer).setUint32(
            offset,
            stringBytes.length,
            true
          );
          offset += 4;
          // Write string data
          result.set(stringBytes, offset);
          offset += stringBytes.length;
          break;

        case "bytes":
          const bytesData = hexToBytes(value);
          // Write length prefix (u32)
          new DataView(result.buffer).setUint32(offset, bytesData.length, true);
          offset += 4;
          // Write bytes data
          result.set(bytesData, offset);
          offset += bytesData.length;
          break;
      }
    }

    // Convert to hex and base58
    const hexResult = bytesToHex(result);
    const base58Result = Base58.encode(result);

    // Display results
    document.getElementById("hex-result").value = hexResult;
    document.getElementById("base58-result").value = base58Result;
    document.getElementById("encode-result").style.display = "block";
  } catch (error) {
    console.error("Encoding error:", error);
    showEncodeError(`Error encoding data: ${error.message}`);
  }
}

// Show decode error message
function showDecodeError(message) {
  const errorElement = document.getElementById("decode-error");
  errorElement.textContent = message;
  errorElement.style.display = "block";
}

// Show encode error message
function showEncodeError(message) {
  const errorElement = document.getElementById("encode-error");
  errorElement.textContent = message;
  errorElement.style.display = "block";
}

// Load decode example
function loadDecodeExample() {
  // Clear previous fields
  const fieldContainer = document.getElementById("fieldContainer");
  fieldContainer.innerHTML = "";

  // Add example fields
  const exampleFields = [
    { name: "purchaseQuantity", type: "u64" },
    { name: "expectedPrice", type: "u64" },
    { name: "seller", type: "publicKey" },
  ];

  for (const field of exampleFields) {
    const fieldRow = document.createElement("div");
    fieldRow.className = "field-row";
    fieldRow.innerHTML = `
                <div class="field-name">
                    <input type="text" class="field-name-input" value="${
                      field.name
                    }" placeholder="Field name">
                </div>
                <div class="field-type">
                    <select class="field-type-select">
                        ${createFieldTypeOptions()}
                    </select>
                </div>
                <button class="btn-small" onclick="removeField(this)">✕</button>
            `;
    fieldContainer.appendChild(fieldRow);

    // Set the correct type
    const typeSelect = fieldRow.querySelector(".field-type-select");
    typeSelect.value = field.type;
  }

  // Set example data - use the actual transaction data from screenshot
  document.getElementById("dataInput").value =
    "70c23f633493553040420f0000000000548c0200000000007027414c760b0bead5ab3dba4f456c06a2cf162ff6d16df43d0b7035371d15d0";

  // Set the correct input mode
  document.getElementById("isBase58").checked = false;
  toggleInputMode();

  // Make sure we're on the decode tab
  switchTab("decode-tab");
}

// Load encode example with correct instruction name and data matching the displayed transaction
function loadEncodeExample() {
  // First load the decode example to set up the fields
  loadDecodeExample();

  // Switch to encode tab
  switchTab("encode-tab");

  // Set example values matching the actual transaction from screenshots
  setTimeout(() => {
    const inputs = document.querySelectorAll(".value-input");
    const values = [
      "1000000", // purchaseQuantity - matching the actual value shown in the screenshot
      "166996", // expectedPrice - matching the actual value shown in the screenshot
      "8YoP1knoxFMgzQxKgAnraWctkre9arBQqQENjpqBw9Sw", // seller - matching the actual key shown in the screenshot
    ];

    for (let i = 0; i < Math.min(inputs.length, values.length); i++) {
      inputs[i].value = values[i];
    }

    // Set the instruction name from the screenshot
    if (document.getElementById("anchorInstructionName")) {
      document.getElementById("anchorInstructionName").value =
        "ProcessExchange";
    }

    // Trigger encode to show the result
    encodeData();
  }, 100);
}

// Initialize with one field and set up Anchor instruction name visibility
document.addEventListener("DOMContentLoaded", function () {
  addField();

  // Initialize the Anchor instruction name container visibility
  toggleAnchorInstructionName();
});
