# Demo Video Guide

## 🎥 How to Create the 1-Minute Demo Video

### Recording Tools (Choose one)
- **Loom** - https://loom.com (Free, easy to use)
- **OBS Studio** - https://obsproject.com (Free, professional)
- **Screen Recording** - Built into Windows (Win+G) or Mac (Cmd+Shift+5)

### Video Structure (60 seconds)

#### **0:00-0:10 - Introduction**
- Show homepage
- Say: "FairDeal - A trustless freelance marketplace on Stellar"
- Highlight key features on screen

#### **0:10-0:20 - Client Flow: Create Job**
- Click "Connect Wallet" → Freighter popup
- Navigate to "Post a Job"
- Fill in:
  - Freelancer address
  - Amount: 100 XLM
  - Deadline: 7 days
  - Description: "Build a landing page"
- Click "Lock Funds & Create Job"
- Show Freighter signature popup
- Show success message with transaction hash

#### **0:20-0:35 - Freelancer Flow: Submit Work**
- Switch to freelancer wallet (or second browser)
- Navigate to job details page
- Click "Submit Work"
- Upload a sample file (e.g., HTML file or image)
- Show encryption happening
- Show success: "Work submitted to IPFS"
- Show preview CID displayed

#### **0:35-0:50 - Client Flow: Review & Approve**
- Back to client wallet
- Refresh job page
- Show watermarked preview loading
- Click "Approve & Pay"
- Show Freighter signature popup
- Show success: "Payment released!"
- Click "Download Original File"
- Show clean file downloaded

#### **0:50-1:00 - Smart Contract Verification**
- Open Stellar Expert link
- Show transaction on blockchain
- Point out:
  - Contract address
  - Amount transferred
  - Status: Success
- End with: "Trustless. Transparent. Built on Stellar."

---

## 📋 Pre-Recording Checklist

### Setup Requirements
1. ✅ Two Stellar testnet wallets (client & freelancer)
2. ✅ Fund both wallets with XLM from [Friendbot](https://laboratory.stellar.org/#account-creator)
3. ✅ Freighter wallet extension installed
4. ✅ Sample file ready for submission (e.g., sample-code.html)
5. ✅ Browser zoom at 100% for clarity
6. ✅ Close unnecessary tabs
7. ✅ Turn off notifications

### Test Run
Before recording, do a full test run:
1. Create job successfully
2. Submit work successfully
3. Approve and download file
4. Verify all steps work smoothly

---

## 🎬 Recording Tips

### Video Quality
- **Resolution**: 1920x1080 (1080p) minimum
- **FPS**: 30fps or higher
- **Audio**: Clear narration (optional but recommended)

### Screen Setup
- Use full-screen browser window
- Hide bookmarks bar for cleaner look
- Use browser dev tools to simulate mobile (optional)

### Narration Script (Optional)

```
"Hi, I'm demonstrating FairDeal - a decentralized freelance marketplace built on Stellar.

[0:10] As a client, I'll create a job by connecting my Freighter wallet and locking 100 XLM in a smart contract.

[0:20] Now as a freelancer, I'll submit my work. The file is automatically encrypted before being stored on IPFS.

[0:35] Back as the client, I can see a watermarked preview. I'll approve the work, which triggers an instant payment from the smart contract.

[0:50] And here's the transaction on Stellar's blockchain - completely trustless and transparent. That's FairDeal."
```

---

## 📤 Publishing the Video

### Upload Options
1. **YouTube** (Recommended)
   - Upload as unlisted or public
   - Add to README: `https://youtu.be/YOUR_VIDEO_ID`

2. **Loom**
   - Record directly in browser
   - Get shareable link automatically

3. **Google Drive**
   - Upload video
   - Set sharing to "Anyone with the link"
   - Get shareable link

4. **Vimeo**
   - Upload for free
   - Get embed link

### Video Settings
- **Title**: "FairDeal - Decentralized Freelance Escrow on Stellar (Demo)"
- **Description**: 
  ```
  FairDeal is a trustless escrow platform for freelancers built on Stellar blockchain.
  
  Features:
  - Smart contract escrow
  - Encrypted IPFS storage
  - Watermarked previews
  - Instant payments
  
  Live: https://fairdeall.vercel.app/
  GitHub: https://github.com/Debjanimandal/FairDeal
  ```
- **Tags**: stellar, blockchain, freelance, soroban, ipfs, web3

---

## 🔗 Adding Video to README

Once uploaded, update README.md line 24:

```markdown
> **📹 [Watch 1-Minute Demo Video](YOUR_VIDEO_LINK_HERE)**
```

Replace `YOUR_VIDEO_LINK_HERE` with your actual video URL.

---

## ✅ Final Checklist

Before submitting:
- [ ] Video is 60 seconds or less
- [ ] Shows all 3 main workflows (create, submit, approve)
- [ ] Shows smart contract transaction on blockchain
- [ ] Video quality is clear and smooth
- [ ] Link is public/shareable
- [ ] Link added to README.md

Good luck! 🎬
