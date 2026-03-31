# Test Screenshots Guide

## 📸 How to Add Your Test Screenshots

This folder should contain **3 screenshots** showing your test outputs with 3+ tests passing.

### Required Screenshots

1. **test-1.png** - Smart contract tests
2. **test-2.png** - API/Integration tests  
3. **test-3.png** - End-to-end workflow tests

### What to Screenshot

#### Option 1: Contract Tests (Recommended)
```bash
cd contract
cargo test
```
Take a screenshot of the terminal showing tests passing.

#### Option 2: Manual Testing Documentation
Create a document showing:
- ✅ Job creation test passed
- ✅ File upload test passed
- ✅ Payment release test passed
- ✅ Smart contract interaction test passed

#### Option 3: Browser Console Tests
Open browser DevTools console and screenshot:
- Successful API calls
- Smart contract transactions
- IPFS uploads

### Screenshot Requirements

- **Format**: PNG or JPG
- **Resolution**: At least 1280x720
- **Visibility**: Text should be readable
- **Content**: Must show at least 3 tests passing

### File Naming

Save your screenshots as:
- `test-1.png`
- `test-2.png`
- `test-3.png`

### Example Test Output to Screenshot

```
✅ Test 1: Create Job - PASSED
✅ Test 2: Submit Work - PASSED
✅ Test 3: Approve Payment - PASSED
✅ Test 4: Cancel Deal - PASSED
✅ Test 5: Fraud Flag - PASSED

All tests passed! (5/5)
```

---

Once you add the screenshots here, they will automatically appear in the README.md file!
