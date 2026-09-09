#!/usr/bin/env python3
"""Branded KCGA desk papers."""
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import Color, HexColor, white
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

OUT = Path("/home/workdir/artifacts/kengriffin-courses/desk/files")
SEAL = Path("/home/workdir/artifacts/kengriffin-courses/assets/dp-seal.jpg")
NAVY = HexColor("#070e1a")
NAVY2 = HexColor("#0c1628")
GOLD = HexColor("#c9a227")
GOLD2 = HexColor("#e8c96a")
IVORY = HexColor("#f3eee2")
MUTE = HexColor("#8b9bb0")
LINE = HexColor("#3a3014")
DISCLAIM = (
    "Independent educational brand. Not affiliated with, endorsed by, or part of "
    "Citadel LLC or Citadel Securities. Nothing in this paper is investment, trading, or employment advice."
)

W, H = letter


def wrap(c, text, x, y, width, font="Times-Roman", size=10.5, leading=15, color=IVORY):
    c.setFillColor(color)
    c.setFont(font, size)
    words = text.split()
    line = ""
    for w in words:
        trial = (line + " " + w).strip()
        if c.stringWidth(trial, font, size) <= width:
            line = trial
        else:
            c.drawString(x, y, line)
            y -= leading
            line = w
    if line:
        c.drawString(x, y, line)
        y -= leading
    return y


def header(c, kicker, title):
    c.setFillColor(NAVY)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(NAVY2)
    c.rect(0, H - 86, W, 86, fill=1, stroke=0)
    c.setStrokeColor(GOLD)
    c.setLineWidth(0.6)
    c.line(0.7 * inch, H - 86, W - 0.7 * inch, H - 86)
    if SEAL.exists():
        c.drawImage(str(SEAL), 0.65 * inch, H - 78, 54, 54, mask="auto")
    c.setFillColor(GOLD)
    c.setFont("Times-Bold", 8)
    c.drawString(1.5 * inch, H - 42, "KEN CORDELE GRIFFIN ACADEMY")
    c.setFillColor(MUTE)
    c.setFont("Times-Roman", 8)
    c.drawString(1.5 * inch, H - 55, kicker.upper())
    c.setFillColor(IVORY)
    c.setFont("Times-Bold", 16)
    c.drawString(1.5 * inch, H - 74, title)


def footer(c, page, total, code):
    c.setStrokeColor(GOLD)
    c.setLineWidth(0.4)
    c.line(0.7 * inch, 0.55 * inch, W - 0.7 * inch, 0.55 * inch)
    c.setFillColor(MUTE)
    c.setFont("Times-Roman", 7)
    c.drawString(0.7 * inch, 0.38 * inch, code)
    c.drawRightString(W - 0.7 * inch, 0.38 * inch, f"{page} / {total}")
    wrap(c, DISCLAIM, 0.7 * inch, 0.26 * inch, W - 1.4 * inch, size=6.2, leading=8, color=MUTE)


def bullets(c, items, x, y, width):
    for item in items:
        c.setFillColor(GOLD)
        c.circle(x + 3, y + 3, 1.6, fill=1, stroke=0)
        y = wrap(c, item, x + 12, y, width - 12, size=10.5, leading=14.5)
        y -= 4
    return y


def section(c, title, y):
    c.setFillColor(GOLD)
    c.setFont("Times-Bold", 11)
    c.drawString(0.7 * inch, y, title.upper())
    c.setStrokeColor(GOLD)
    c.setLineWidth(0.4)
    c.line(0.7 * inch, y - 4, W - 0.7 * inch, y - 4)
    return y - 20


def newpage(c, kicker, title, page, total, code):
    c.showPage()
    header(c, kicker, title)
    footer(c, page, total, code)
    return H - 110


DOCS = {}


def market_map(path):
    c = canvas.Canvas(str(path), pagesize=letter)
    code = "KCGA-MAP-01"
    title = "The Market Map"
    kicker = "Desk standard"
    header(c, kicker, title)
    footer(c, 1, 3, code)
    y = H - 112
    y = wrap(c, "A market is not a mood and it is not a chart. It is an arrangement: who may trade, in what, against whom, on what terms, with what information, and through which pipes the trade becomes cash. This sheet is the academy’s working map. Every later paper hangs on one of these layers.", 0.7 * inch, y, W - 1.4 * inch)
    y -= 8
    y = section(c, "The eight layers", y)
    layers = [
        ("1  Structure", "Rules that exist before a price: listing, hours, tick size, lot size, who is allowed to make a market, what happens in a halt. Structure is the constitution. Change it and every other layer moves."),
        ("2  Participants", "Issuers, intermediaries, principals, agents, indexers, hedgers, retail, official accounts. Motive differs. Capacity differs. Time horizon differs. Treating them as one crowd is how people invent a ‘market’ that does not exist."),
        ("3  Instruments", "Cash, future, option, swap, fund share, loan. Each is a bundle of rights and a calendar of cash. The instrument is the object. Confusing the object with the story about the object is the first sloppy habit."),
        ("4  The book", "Displayed size, hidden size, auction versus continuous, last print versus the live bid and offer. The book is the only public statement of willingness to trade now."),
        ("5  Liquidity", "Tightness, depth, immediacy, resilience. Four measurements, not one adjective. A market can be tight and shallow. It can look deep until you lift it."),
        ("6  Risk", "What you can lose, how fast, from which source: market, credit, liquidity, operational, model, conduct. Risk is named before a thesis is allowed to stand."),
        ("7  Information", "What is public, what is delayed, what is private, what is noise. Edge is a claim about information plus the capacity to act on it before the book adjusts."),
        ("8  Plumbing", "Clearing, settlement, margin, collateral, failed trades, corporate actions. A print that does not become cash is not a completed market event."),
    ]
    for head, body in layers:
        c.setFillColor(GOLD2)
        c.setFont("Times-Bold", 10.5)
        c.drawString(0.7 * inch, y, head)
        y -= 14
        y = wrap(c, body, 0.7 * inch, y, W - 1.4 * inch, size=10)
        y -= 8
        if y < 90:
            y = newpage(c, kicker, title, 2, 3, code)
    y = newpage(c, kicker, title, 3, 3, code)
    y = section(c, "How to use the map", y)
    y = bullets(c, [
        "Name the layer before you name the opinion. If you cannot say which layer you are talking about, you are not talking about the market.",
        "When two stories conflict, ask which layer each story lives on. Most arguments are people standing on different floors.",
        "A change in structure (tick size, close auction, short-sale rule) is not a ‘sentiment’ event. Treat it as a rewrite of the constitution.",
        "Do not skip plumbing. Settlement failure, margin call, and corporate action have ended more positions than a wrong forecast.",
    ], 0.7 * inch, y, W - 1.4 * inch)
    y -= 6
    y = section(c, "What this paper is not", y)
    y = wrap(c, "It is not a forecast. It is not a list of names to buy. It is not a description of any particular firm’s method. It is a vocabulary so that a participant can look at one object — the market — and not confuse the parts.", 0.7 * inch, y, W - 1.4 * inch)
    c.save()


def memo(path):
    c = canvas.Canvas(str(path), pagesize=letter)
    code, title, kicker = "KCGA-MEMO-01", "The One-Page Memo", "Decision standard"
    header(c, kicker, title); footer(c, 1, 2, code)
    y = H - 112
    y = wrap(c, "A decision that cannot be written on one page is not finished. The academy uses five lines. If a line is empty, the decision is not ready to be taken, filed, or defended.", 0.7 * inch, y, W - 1.4 * inch)
    y -= 10
    lines = [
        ("Line 1 — Object", "Name the instrument, the venue, and the horizon in one sentence. Not the sector story. The object."),
        ("Line 2 — Claim", "The falsifiable statement. ‘X will happen because Y, and I will know I was wrong if Z prints.’ Without Z, it is not a claim."),
        ("Line 3 — Other side", "Who is on the other side of the trade and why they are willing. If you cannot name them, you do not have a market — you have a wish."),
        ("Line 4 — Risk inventory", "What you can lose, in units of money and in units of time, and which layer produces the loss. Cap first. Thesis second."),
        ("Line 5 — Plumbing", "How the trade is booked, margined, settled, and closed. If this line is vague, the first four lines are theatre."),
    ]
    for h, b in lines:
        c.setFillColor(GOLD2); c.setFont("Times-Bold", 11); c.drawString(0.7 * inch, y, h); y -= 15
        y = wrap(c, b, 0.7 * inch, y, W - 1.4 * inch); y -= 10
    y = newpage(c, kicker, title, 2, 2, code)
    y = section(c, "House rules", y)
    y = bullets(c, [
        "One memo per decision. Do not staple two trades together to make the story prettier.",
        "Date the memo. A claim without a clock is not a claim.",
        "When the falsifier prints, the memo is closed. Do not rewrite history in the same file.",
        "Office hours exist to pressure-test Line 3 and Line 4, not to decorate Line 2.",
        "The binder is the record. A conversation is not the record.",
    ], 0.7 * inch, y, W - 1.4 * inch)
    y -= 8
    y = section(c, "Blank five-line pad", y)
    for i, lab in enumerate(["Object", "Claim", "Other side", "Risk", "Plumbing"], 1):
        c.setFillColor(GOLD); c.setFont("Times-Bold", 9)
        c.drawString(0.7 * inch, y, f"{i}. {lab}")
        c.setStrokeColor(LINE); c.setLineWidth(0.4)
        c.line(1.7 * inch, y, W - 0.7 * inch, y)
        y -= 28
    c.save()


def risk(path):
    c = canvas.Canvas(str(path), pagesize=letter)
    code, title, kicker = "KCGA-RISK-01", "Risk Inventory", "Before the thesis"
    header(c, kicker, title); footer(c, 1, 2, code)
    y = H - 112
    y = wrap(c, "Risk is not volatility. Volatility is one measurement of one kind of movement. Risk is the set of ways a position can fail to become the cash you thought it would. Inventory it before you write a claim.", 0.7 * inch, y, W - 1.4 * inch)
    y -= 8
    y = section(c, "Sources to name", y)
    rows = [
        ("Market", "The object moves against the claim. Size the loss in money, not in adjectives."),
        ("Liquidity", "You can be right and still unable to exit at a book that existed a minute ago. Depth and resilience belong here."),
        ("Credit / counterparty", "The other name on the ticket cannot perform. Prime, clearing, issuer, swap dealer."),
        ("Operational", "Wrong booking, wrong account, missed corporate action, fat finger, halted venue."),
        ("Model", "The map you used is not the territory. Greeks, factor loadings, correlation that held until it did not."),
        ("Conduct / legal", "You were not allowed to hold what you hold, or the way you hold it is not allowed."),
        ("Horizon", "The claim can be right after you are forced out. Time is a risk source."),
    ]
    for h, b in rows:
        c.setFillColor(GOLD2); c.setFont("Times-Bold", 10.5); c.drawString(0.7 * inch, y, h); y -= 14
        y = wrap(c, b, 0.7 * inch, y, W - 1.4 * inch, size=10); y -= 6
    y = newpage(c, kicker, title, 2, 2, code)
    y = section(c, "Inventory method", y)
    y = bullets(c, [
        "Write the maximum acceptable loss first. Then ask whether the claim is worth that number.",
        "Separate ‘I am uncomfortable’ from ‘the position is not allowed.’ The first is temperament. The second is a rule.",
        "If two sources can hit on the same day (market + liquidity), do not add them as if they were independent.",
        "Review the inventory when structure changes: new margin, new halt rule, new borrow.",
        "A hedge is not a feeling. Name what it offsets and what it does not.",
    ], 0.7 * inch, y, W - 1.4 * inch)
    c.save()


def liq(path):
    c = canvas.Canvas(str(path), pagesize=letter)
    code, title, kicker = "KCGA-LIQ-01", "Liquidity Scorecard", "Four measurements"
    header(c, kicker, title); footer(c, 1, 2, code)
    y = H - 112
    y = wrap(c, "Calling a market ‘liquid’ is not analysis. Kyle, Amihud, and the market-microstructure literature split the word into measurements that can disagree with each other. Use all four.", 0.7 * inch, y, W - 1.4 * inch)
    y -= 10
    four = [
        ("Tightness", "The cost of a small round trip now — spread, fees, half-spread paid. Tight is not the same as safe."),
        ("Depth", "How much size sits at and behind the inside. A one-lot inside is not a market you can use."),
        ("Immediacy", "How fast you can complete a given size. Auction versus continuous. Hidden versus displayed."),
        ("Resilience", "How quickly the book repairs after you take it. A print that leaves a hole is a different object from a print that is absorbed."),
    ]
    for h, b in four:
        c.setFillColor(GOLD2); c.setFont("Times-Bold", 12); c.drawString(0.7 * inch, y, h); y -= 16
        y = wrap(c, b, 0.7 * inch, y, W - 1.4 * inch); y -= 10
    y = newpage(c, kicker, title, 2, 2, code)
    y = section(c, "Scorecard practice", y)
    y = bullets(c, [
        "Score the object at the size you actually trade, not at the inside quote.",
        "Note the session: open, continuous, close, halt reopen. Liquidity is a function of the clock.",
        "Compare displayed depth with what actually trades when you lift it. The difference is information.",
        "Resilience is observed after the fact. Write what you saw. Do not invent it in advance and call it a model.",
        "A scorecard is dated. Yesterday’s tightness is not today’s.",
    ], 0.7 * inch, y, W - 1.4 * inch)
    c.save()


def other(path):
    c = canvas.Canvas(str(path), pagesize=letter)
    code, title, kicker = "KCGA-EDGE-01", "The Other Side", "Edge as a claim"
    header(c, kicker, title); footer(c, 1, 2, code)
    y = H - 112
    y = wrap(c, "Every completed trade has two willing parties. If you cannot say who is selling what you are buying — and why they are willing — you do not have an edge. You have a narrative with a blank across the table.", 0.7 * inch, y, W - 1.4 * inch)
    y -= 10
    y = section(c, "What edge is", y)
    y = wrap(c, "Edge is a claim that you hold information, or a capacity to act on information, that is not yet in the book at your size. It must be falsifiable. ‘The stock is cheap’ is not edge. ‘This holder must sell by Friday because of X, and the book at this size cannot absorb it without moving Y’ is a claim.", 0.7 * inch, y, W - 1.4 * inch)
    y -= 8
    y = section(c, "Questions that belong on Line 3", y)
    y = bullets(c, [
        "Is the other side a forced seller, a hedger, an indexer, an agent, or a principal with a different horizon?",
        "Do they know what you think you know? If yes, why are they still willing?",
        "Is your capacity (capital, access, speed, mandate) the actual difference — not your opinion?",
        "What would make them more willing tomorrow, which would erase the claim?",
    ], 0.7 * inch, y, W - 1.4 * inch)
    y = newpage(c, kicker, title, 2, 2, code)
    y = section(c, "Forbidden substitutions", y)
    y = bullets(c, [
        "Do not replace the other side with a television personality.",
        "Do not replace the other side with ‘the market.’ The market is the arrangement. It does not sit across from you.",
        "Do not treat a backtest as a person. A curve has no mandate and no constraint.",
        "Do not treat your own earlier self as the other side unless you are closing your own position.",
    ], 0.7 * inch, y, W - 1.4 * inch)
    c.save()


def plumbing(path):
    c = canvas.Canvas(str(path), pagesize=letter)
    code, title, kicker = "KCGA-PIPE-01", "Plumbing", "From print to cash"
    header(c, kicker, title); footer(c, 1, 2, code)
    y = H - 112
    y = wrap(c, "A last print is a statement that two parties agreed a price at a time. It is not cash. Cash appears after clearing, settlement, margin, and the absence of a fail. This paper is the last layer of the map and the last line of the memo.", 0.7 * inch, y, W - 1.4 * inch)
    y -= 8
    y = section(c, "The path", y)
    steps = [
        "Execution: the venue accepts the order under its rules.",
        "Matching: a contra is found at a price the rules allow.",
        "Reporting: the print is published. Publication is not settlement.",
        "Clearing: a central counterparty or bilateral process novates or records the obligation.",
        "Margin and collateral: resources are locked against the obligation.",
        "Settlement: securities and cash move on the stated cycle. Fails are a market event.",
        "Corporate actions: the object itself can change while you think you still hold it.",
    ]
    y = bullets(c, steps, 0.7 * inch, y, W - 1.4 * inch)
    y = newpage(c, kicker, title, 2, 2, code)
    y = section(c, "Questions for Line 5", y)
    y = bullets(c, [
        "Where is this booked and who is the clearer?",
        "What is the settlement cycle and what happens on a fail?",
        "What margin can be called, overnight, and by whom?",
        "Can the instrument be borrowed? What happens if the borrow is recalled?",
        "What corporate action sits on the calendar inside the horizon of the claim?",
    ], 0.7 * inch, y, W - 1.4 * inch)
    c.save()


def syllabus(path):
    c = canvas.Canvas(str(path), pagesize=letter)
    code, title, kicker = "KCGA-SYL-01", "Foundations Syllabus", "Eight weeks"
    header(c, kicker, title); footer(c, 1, 2, code)
    y = H - 112
    y = wrap(c, "Foundations of the Market is eight weeks. The aim is a working command of the map, the memo, and the inventory — not a forecast and not a job. Deliverables are written. Conversation is not a deliverable.", 0.7 * inch, y, W - 1.4 * inch)
    y -= 8
    weeks = [
        ("Week 1", "The market as an arrangement. Read the Map. File a one-page description of one venue you actually use."),
        ("Week 2", "Structure. Hours, ticks, lots, halts. Memo: what rule, if changed tomorrow, would rewrite your object."),
        ("Week 3", "Participants and instruments. Who is forced, who is optional, what rights the instrument actually contains."),
        ("Week 4", "The book. Watch one session. Record inside, depth, and what traded through it."),
        ("Week 5", "Liquidity scorecard on one object, at your size, for two different hours."),
        ("Week 6", "Risk inventory on a hypothetical claim. Cap first."),
        ("Week 7", "Information and the other side. Write Line 3 until it names a person or a mandate, not a mood."),
        ("Week 8", "Plumbing and close. Full five-line memo on one object. Office hours on Line 4 and Line 5."),
    ]
    for h, b in weeks:
        c.setFillColor(GOLD2); c.setFont("Times-Bold", 11); c.drawString(0.7 * inch, y, h)
        y = wrap(c, b, 1.55 * inch, y, W - 2.25 * inch, size=10.5); y -= 8
    y = newpage(c, kicker, title, 2, 2, code)
    y = section(c, "Completion", y)
    y = bullets(c, [
        "Eight memos or the equivalent desk pages in the binder.",
        "One completed scorecard and one completed inventory.",
        "Password changed after first entry to the desk.",
        "No public download of these papers. They live on the issued profile.",
    ], 0.7 * inch, y, W - 1.4 * inch)
    c.save()


def conduct(path):
    c = canvas.Canvas(str(path), pagesize=letter)
    code, title, kicker = "KCGA-CON-01", "Conduct of the Desk", "How the academy is run"
    header(c, kicker, title); footer(c, 1, 2, code)
    y = H - 112
    y = wrap(c, "The academy is an independent educational desk. It is not a broker, not an adviser, not an employer, and not a unit of any trading firm. Profiles are issued. They are not purchased from a public cart.", 0.7 * inch, y, W - 1.4 * inch)
    y -= 8
    y = section(c, "Who governs", y)
    y = wrap(c, "ceo@kengriffin.courses and admissions@kengriffin.courses are the only administrators. They issue profiles, set week, post insights, and may retire a profile. Participants do not create accounts for other people.", 0.7 * inch, y, W - 1.4 * inch)
    y -= 8
    y = section(c, "What a participant does", y)
    y = bullets(c, [
        "Signs in with the issued email and the system password, then changes that password.",
        "Works the map, the memo, the inventory, and the scorecard.",
        "Reads insights posted by the administrator. Does not publish to the desk.",
        "Treats every paper as education about market structure, not as an instruction to trade.",
    ], 0.7 * inch, y, W - 1.4 * inch)
    y = newpage(c, kicker, title, 2, 2, code)
    y = section(c, "What this desk will not do", y)
    y = bullets(c, [
        "Will not recommend a security, a timing, or a size.",
        "Will not place or route an order.",
        "Will not represent itself as Citadel, Citadel Securities, or any employer.",
        "Will not sell a public download of the desk papers.",
        "Will not treat a conversation as a substitute for a filed memo.",
    ], 0.7 * inch, y, W - 1.4 * inch)
    y -= 6
    y = section(c, "Independence", y)
    y = wrap(c, DISCLAIM, 0.7 * inch, y, W - 1.4 * inch)
    c.save()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    market_map(OUT / "kcga-market-map.pdf")
    memo(OUT / "kcga-one-page-memo.pdf")
    risk(OUT / "kcga-risk-inventory.pdf")
    liq(OUT / "kcga-liquidity-scorecard.pdf")
    other(OUT / "kcga-other-side.pdf")
    plumbing(OUT / "kcga-plumbing.pdf")
    syllabus(OUT / "kcga-foundations-syllabus.pdf")
    conduct(OUT / "kcga-conduct.pdf")
    for p in sorted(OUT.glob("kcga-*.pdf")):
        print(p.name, p.stat().st_size)

if __name__ == "__main__":
    main()
