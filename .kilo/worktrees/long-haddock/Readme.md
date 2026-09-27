# Project: AI-Powered Employee Travel Expense Reimbursement System

## What it is
A full-stack web app where employees create trips, upload expense receipts, and get reimbursed — with AI automatically reading bill details so they don't have to type everything manually.

## Tech Stack
- **Frontend:** React + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** MongoDB Atlas
- **File Storage:** Cloudinary (receipt images)
- **AI/OCR:** Python microservice running Donut (a self-hosted vision transformer model), with Tesseract OCR as backup

## How the OCR/AI works
1. Employee uploads a photo of a receipt
2. Image is sent to a **Donut model** (deep learning vision transformer, pretrained on receipt data) — it visually "reads" the receipt like a human would, distinguishing total vs subtotal vs tax
3. **Simultaneously**, a backup Tesseract OCR pass extracts the date and acts as a fallback
4. If both methods disagree or fail, the system flags it as **low confidence** and warns the employee
5. Extracted data (amount, merchant, category, date) **pre-fills the expense form** — employee reviews/edits before submitting (human-in-the-loop, never auto-submits blindly)

**Tested accuracy:** 50% exact-match on amount, 64% on merchant name, benchmarked on a public dataset (SROIE) the model wasn't trained on — an honest, non-inflated number, backed by fallback logic in production.

## Core Features

**Employee side:**
- Create trips, add expenses inside them
- **Quick Scan** — scan a bill first, then assign it to a new or existing trip (flexible entry)
- AI-assisted auto-fill from receipt photos
- Track approval status and reimbursement per trip

**Admin side:**
- Review and approve/reject individual expenses with comments
- **Policy engine** — set per-category spending limits; expenses exceeding limits get auto-flagged for review
- **Analytics dashboard** — spend by category (pie chart), top spenders (bar chart), monthly trend, pending counts
- Mark trips as reimbursed

**Data captured per expense:**
Category, merchant name, amount, currency, filing date, bill date (from receipt), payment method (cash/card), description, receipt image, approval status, policy violation flag

## Why it's a strong product pitch
- **Not just a form + database** — has a genuine self-hosted ML model doing real work, not a paid third-party API wrapper
- **Policy compliance built-in** — catches overspending automatically, before it reaches an approver
- **Flexible UX** — two ways to log expenses depending on how the employee wants to work
- **Data-driven admin insights** — spending patterns visible at a glance, not buried in spreadsheets
- **Honest, safeguarded AI** — doesn't pretend the model is perfect; built proper fallback + human review, which is exactly how production ML systems are designed