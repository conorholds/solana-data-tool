# Solana Instruction Data Tool

A client-side tool for encoding and decoding Solana program instruction data.

## Overview

Solana Instruction Data Tool is a web application that helps developers work with the binary data used in Solana smart contract interactions. It provides a simple interface for:

1. **Decoding**: Convert raw binary/hex data from Solana transaction instructions into structured, human-readable JSON.
2. **Encoding**: Convert structured data into properly formatted binary data for use in Solana transactions.

## Features

### Data Structure Definition

The tool allows you to define custom data structures with various Solana-compatible data types:

- Integer types: `u8`, `u16`, `u32`, `u64`, `u128`, `i8`, `i16`, `i32`, `i64`, `i128`
- Boolean values
- Public keys (32-byte addresses)
- Strings (with length prefix)
- Byte arrays (with length prefix)

### Decoding Features

- Support for Anchor program discriminators (8-byte prefix)
- Accept input in both hex and Base58 formats
- Detailed error messages for malformed data
- Handles a wide range of data types with proper endianness

### Encoding Features

- Generate correctly formatted binary data for Solana transactions
- Output in both hex and Base58 formats
- Validate input values against their declared types
- Optional Anchor program discriminator inclusion

## Implementation Details

### Binary Format

Solana instruction data follows specific binary encoding rules:

- Integer types are stored in little-endian byte order
- Booleans are represented as a single byte (0 or 1)
- Strings and byte arrays include a 4-byte length prefix
- Public keys are stored as raw 32-byte arrays

### Anchor Program Support

For Anchor programs, the tool handles the 8-byte discriminator that precedes instruction data:

1. When decoding, it can skip the first 8 bytes (the discriminator)
2. When encoding, it can prepend a placeholder discriminator

### Type Validations

The tool performs comprehensive validation:

- Number ranges (e.g., a `u8` must be 0-255)
- Public key format (valid Base58 string of correct length)
- Boolean values
- Proper hex format for byte arrays

## Usage Examples

### Decoding Instruction Data

To decode Solana transaction instruction data:

1. Define the data structure by adding fields with appropriate types
2. Toggle the Anchor Program switch if dealing with Anchor program data
3. Select the input format (hex or Base58)
4. Paste the instruction data
5. Click "Decode Data"

### Encoding Instruction Data

To encode data for a Solana transaction:

1. Define the data structure by adding fields with appropriate types
2. Toggle the Anchor Program switch if creating data for an Anchor program
3. Enter values for each field
4. Click "Encode Data"
5. Use the resulting hex or Base58 output in your transaction

## Common Use Cases

- Debugging Solana transactions by decoding instruction data
- Building and testing transaction data for integration testing
- Inspecting on-chain program data
- Educational purposes to understand Solana's data encoding

## Further Reading

- [Solana Transactions Documentation](https://solana.com/docs/core/transactions)
- [Anchor Framework Documentation](https://book.anchor-lang.com/)
- [Solana Web3.js Documentation](https://solana.com/docs/clients/javascript)
- [Borsh Serialization Format](https://borsh.io/) (Used by many Solana programs)

## License

This project is licensed under the MIT License. See the LICENSE file for details.
