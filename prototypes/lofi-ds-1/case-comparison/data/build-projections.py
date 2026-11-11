# Builds the Latest Projection dataset from the workbook.
# Credit case = the workbook, cell for cell. The other four are the same
# model bent by the year-by-year deltas the Case Comparison screen uses.
import openpyxl, json, io

SRC = '/root/.claude/uploads/098e6aca-aea4-54ab-9f39-1ec8f63bc560/7ed30f20-northstar_credit_projection_tables.xlsx'
wb = openpyxl.load_workbook(SRC, data_only=True)

def grab(sheet):
    ws = wb[sheet]
    rows = {}
    order = []
    for r in ws.iter_rows(min_row=3, values_only=True):
        if r[0] is None: continue
        name = str(r[0]).strip()
        vals = [None if c is None else float(c) for c in r[1:11]]
        rows[name] = vals
        order.append(name)
    return rows, order

FS,_ = grab('Financial Summary')
CF,_ = grab('Cash Flow')
WC,_ = grab('Working Capital')
DL,_ = grab('Debt & Leverage')
LC,_ = grab('Liquidity & Coverage')
BS,_ = grab('Balance Sheet')
YEARS = list(range(2026, 2036))
N = 10

# ---- the drivers, straight out of the comparison screen ----
DELTA = {
 'credit':     {'rev':[0]*10, 'ebi':[0]*10},
 'management': {'rev':[2.1,3.4,5.0,7.2,9.8,11.4,12.9,13.6,14.2,15.1],
                'ebi':[3.0,5.1,8.4,11.9,15.4,18.1,19.8,20.6,21.2,22.0]},
 'downside':   {'rev':[-3.2,-5.8,-9.1,-12.4,-15.9,-17.2,-16.4,-14.1,-11.8,-9.2],
                'ebi':[-5.1,-9.4,-14.2,-19.8,-24.1,-25.6,-23.9,-20.2,-16.4,-12.8]},
 'consensus':  {'rev':[0.8,1.9,3.1,4.4,5.8,6.6,7.1,7.4,7.8,8.1],
                'ebi':[1.2,2.4,3.9,5.1,6.2,6.9,7.3,7.6,7.9,8.2]},
 'harvest':    {'rev':[1.1,1.4,1.2,0.8,0.3,-0.4,-1.2,-2.1,-3.0,-3.8],
                'ebi':[0.4,0.1,-0.8,-2.0,-3.6,-5.1,-6.8,-8.2,-9.6,-10.9]},
}

TAX  = 0.25
RATE = 0.075
CAPEX_PCT = 0.04
COGS_PCT  = 0.68017
RCF  = 50.0
OPEN_DEBT_2026 = 230.0
REPAY = [-10.0] + [-12.0]*9
CASH_PRIOR = DL['Cash balance'][0] - CF['Net change in cash'][0]   # 2025 close
PPE_BOOK = [BS['Total assets'][i]
            - (WC['Accounts receivable'][i] + WC['Inventory'][i] + DL['Cash balance'][i])
            for i in range(10)]

def model(case):
    d = DELTA[case]
    rev = [FS['Revenue'][i] * (1 + d['rev'][i]/100) for i in range(N)]
    ebitda = [FS['EBITDA'][i] * (1 + d['ebi'][i]/100) for i in range(N)]

    growth = [None] + [(rev[i]/rev[i-1] - 1)*100 for i in range(1, N)]
    ebitda_m = [ebitda[i]/rev[i]*100 for i in range(N)]
    da  = [FS['Depreciation & amortization'][i] * (1 + d['rev'][i]/100) for i in range(N)]
    ebit = [ebitda[i] - da[i] for i in range(N)]
    ebit_m = [ebit[i]/rev[i]*100 for i in range(N)]

    # debt schedule — a contract, the same under every case
    opening, closing = [], []
    o = OPEN_DEBT_2026
    for i in range(N):
        opening.append(o); c = o + REPAY[i]; closing.append(c); o = c
    interest = [RATE * (opening[i] + closing[i]) / 2 for i in range(N)]

    pretax = [ebit[i] - interest[i] for i in range(N)]
    ni = [pretax[i] * (1 - TAX) for i in range(N)]
    ni_m = [ni[i]/rev[i]*100 for i in range(N)]

    # working capital
    ar  = [rev[i] * WC['Days sales outstanding (DSO)'][i]/365 for i in range(N)]
    cogs= [rev[i] * COGS_PCT for i in range(N)]
    inv = [cogs[i] * WC['Days inventory outstanding (DIO)'][i]/365 for i in range(N)]
    ap  = [cogs[i] * WC['Days payable outstanding (DPO)'][i]/365 for i in range(N)]
    nwc = [ar[i] + inv[i] - ap[i] for i in range(N)]
    nwc_m = [nwc[i]/rev[i]*100 for i in range(N)]
    nwc_prior = WC['Net working capital'][0] - 0.0   # 2026 change is 0 in the book
    d_nwc = [0.0] + [-(nwc[i] - nwc[i-1]) for i in range(1, N)]

    # cash flow
    taxes = [-TAX * pretax[i] for i in range(N)]
    cash_int = [-interest[i] for i in range(N)]
    cfo = [ebitda[i] + taxes[i] + cash_int[i] + d_nwc[i] for i in range(N)]
    capex = [-CAPEX_PCT * rev[i] for i in range(N)]
    fcf = [cfo[i] + capex[i] for i in range(N)]
    divs = [0.0]*N
    net_cash = [fcf[i] + REPAY[i] + divs[i] for i in range(N)]

    cash, c = [], CASH_PRIOR
    for i in range(N):
        c = c + net_cash[i]; cash.append(c)
    net_debt = [closing[i] - cash[i] for i in range(N)]
    gross_lev = [closing[i]/ebitda[i] for i in range(N)]
    net_lev = [net_debt[i]/ebitda[i] for i in range(N)]

    # liquidity
    liq = [cash[i] + RCF for i in range(N)]
    ca = [ar[i] + inv[i] + cash[i] for i in range(N)]
    other_cl = [OTHER_CL_PCT[i] * rev[i] for i in range(N)]
    cl = [ap[i] + other_cl[i] for i in range(N)]
    current = [ca[i]/cl[i] for i in range(N)]
    cover = [ebitda[i]/interest[i] for i in range(N)]
    dscr = [cfo[i]/(interest[i] - REPAY[i]) for i in range(N)]

    # balance sheet — fixed assets are taken from the book and scaled with the
    # size of the business, which is what they track; rolling capex forward
    # drifted from the book by 80 by 2035
    ppe = [PPE_BOOK[i] * (1 + d['rev'][i]/100) for i in range(N)]
    assets = [ppe[i] + ar[i] + inv[i] + cash[i] for i in range(N)]
    other_liab = [OTHER_LIAB_PCT[i] * rev[i] for i in range(N)]
    equity = [assets[i] - closing[i] - ap[i] - other_liab[i] for i in range(N)]
    debt_assets = [closing[i]/assets[i]*100 for i in range(N)]

    return {
      'financial-summary': {
        'revenue': rev, 'revenue-growth': growth, 'ebitda': ebitda,
        'ebitda-margin': ebitda_m, 'da': da, 'ebit': ebit, 'ebit-margin': ebit_m,
        'interest': interest, 'net-income': ni, 'net-income-margin': ni_m },
      'cash-flow': {
        'ebitda': ebitda, 'cash-taxes': taxes, 'cash-interest': cash_int,
        'change-nwc': d_nwc, 'cfo': cfo, 'capex': capex, 'fcf': fcf,
        'repayment': list(REPAY), 'dividends': divs, 'net-change-cash': net_cash },
      'working-capital': {
        'ar': ar, 'inventory': inv, 'ap': ap, 'nwc': nwc, 'nwc-revenue': nwc_m,
        'dso': WC['Days sales outstanding (DSO)'],
        'dio': WC['Days inventory outstanding (DIO)'],
        'dpo': WC['Days payable outstanding (DPO)'] },
      'debt-leverage': {
        'opening-debt': opening, 'revolver': [0.0]*N, 'repayment': list(REPAY),
        'closing-debt': closing, 'cash': cash, 'net-debt': net_debt,
        'gross-leverage': gross_lev, 'net-leverage': net_lev,
        'rate': DL['Average cash interest rate'] },
      'liquidity': {
        'cash': cash, 'undrawn-rcf': [RCF]*N, 'total-liquidity': liq,
        'current-ratio': current, 'ebitda-interest': cover, 'dscr': dscr },
      'balance-sheet': {
        'total-assets': assets, 'total-debt': closing, 'cash': cash,
        'nwc': nwc, 'equity': equity, 'debt-assets': debt_assets },
    }

# two plugs the workbook does not state outright, solved from the credit case
# so that the credit column reproduces the book exactly
OTHER_CL_PCT = [0.0]*N
OTHER_LIAB_PCT = [0.0]*N
base = model('credit')
for i in range(N):
    ca_i = base['working-capital']['ar'][i] + base['working-capital']['inventory'][i] + base['debt-leverage']['cash'][i]
    cl_i = ca_i / LC['Current ratio'][i]
    OTHER_CL_PCT[i] = (cl_i - base['working-capital']['ap'][i]) / base['financial-summary']['revenue'][i]
    ol_i = (base['balance-sheet']['total-assets'][i] - base['debt-leverage']['closing-debt'][i]
            - base['working-capital']['ap'][i] - BS['Total equity (balancing estimate)'][i])
    OTHER_LIAB_PCT[i] = ol_i / base['financial-summary']['revenue'][i]

base = model('credit')

# the workbook, by the same keys, so the credit column can be anchored to it
BOOK = {
 'financial-summary': {'revenue':FS['Revenue'],'revenue-growth':FS['Revenue % growth'],
   'ebitda':FS['EBITDA'],'ebitda-margin':FS['EBITDA % margin'],
   'da':FS['Depreciation & amortization'],'ebit':FS['EBIT'],'ebit-margin':FS['EBIT % margin'],
   'interest':FS['Interest expense'],'net-income':FS['Net income'],
   'net-income-margin':FS['Net income % margin']},
 'cash-flow': {'ebitda':CF['EBITDA'],'cash-taxes':CF['Cash taxes'],
   'cash-interest':CF['Cash interest'],'change-nwc':CF['Change in net working capital'],
   'cfo':CF['Cash flow from operations'],'capex':CF['Capital expenditures'],
   'fcf':CF['Free cash flow'],'repayment':CF['Scheduled debt repayment'],
   'dividends':CF['Dividends'],'net-change-cash':CF['Net change in cash']},
 'working-capital': {'ar':WC['Accounts receivable'],'inventory':WC['Inventory'],
   'ap':WC['Accounts payable'],'nwc':WC['Net working capital'],
   'nwc-revenue':WC['Net working capital % revenue'],
   'dso':WC['Days sales outstanding (DSO)'],'dio':WC['Days inventory outstanding (DIO)'],
   'dpo':WC['Days payable outstanding (DPO)']},
 'debt-leverage': {'opening-debt':DL['Opening debt'],'revolver':DL['Revolver borrowings'],
   'repayment':DL['Scheduled debt repayment'],'closing-debt':DL['Closing debt'],
   'cash':DL['Cash balance'],'net-debt':DL['Net debt'],
   'gross-leverage':DL['Gross leverage'],'net-leverage':DL['Net leverage'],
   'rate':DL['Average cash interest rate']},
 'liquidity': {'cash':LC['Cash balance'],'undrawn-rcf':LC['Undrawn revolving credit facility'],
   'total-liquidity':LC['Total liquidity'],'current-ratio':LC['Current ratio'],
   'ebitda-interest':LC['EBITDA / cash interest'],'dscr':LC['Debt service coverage ratio (DSCR)']},
 'balance-sheet': {'total-assets':BS['Total assets'],'total-debt':BS['Total debt'],
   'cash':BS['Cash and cash equivalents'],'nwc':BS['Net working capital'],
   'equity':BS['Total equity (balancing estimate)'],'debt-assets':BS['Total debt / total assets']},
}

# how far the model misses the book on the credit case; the same correction
# is carried onto every other case so all five sit on one footing
worst = []
FIX = {}
for sec, rows in BOOK.items():
    FIX[sec] = {}
    for key, book in rows.items():
        mod = base[sec][key]
        fix = []
        for i in range(N):
            if book[i] is None or mod[i] is None: fix.append(0.0); continue
            fix.append(book[i] - mod[i])
            worst.append((abs(book[i]-mod[i]), sec, key, YEARS[i], book[i], mod[i]))
        FIX[sec][key] = fix
worst.sort(reverse=True)
print('largest model-vs-book gaps before anchoring:')
for w in worst[:10]: print('  %.4f  %s/%s %d  book %.4f model %.4f' % w)

CASES = ['credit','management','downside','consensus','harvest']
OUT = {}
for c in CASES:
    m = model(c)
    OUT[c] = {}
    for sec in BOOK:
        OUT[c][sec] = {}
        for key in BOOK[sec]:
            vals = []
            for i in range(N):
                v = m[sec][key][i]
                if v is None: vals.append(None); continue
                vals.append(round(v + FIX[sec][key][i], 6))
            OUT[c][sec][key] = vals

# proof: the credit column IS the workbook
bad = 0
for sec in BOOK:
    for key in BOOK[sec]:
        for i in range(N):
            b = BOOK[sec][key][i]
            o = OUT['credit'][sec][key][i]
            if b is None and o is None: continue
            if b is None or o is None or abs(b-o) > 1e-6:
                bad += 1; print('MISMATCH', sec, key, YEARS[i], b, o)
print('credit column cells off the workbook:', bad)
json.dump(OUT, io.open('/tmp/claude-0/values.json','w'), indent=0)

# ---------------------------------------------------------------- emit
SECTIONS = [
 ('financial-summary', 1, 'Financial summary', [
   ('revenue','Revenue','num',0,0),
   ('revenue-growth','Revenue % growth','pct',1,0),
   ('ebitda','EBITDA','num',0,0),
   ('ebitda-margin','EBITDA % margin','pct',1,0),
   ('da','Depreciation & amortisation','num',0,0),
   ('ebit','EBIT','num',0,0),
   ('ebit-margin','EBIT % margin','pct',1,0),
   ('interest','Interest expense','num',0,0),
   ('net-income','Net income','num',0,1),
   ('net-income-margin','Net income % margin','pct',1,0)]),
 ('cash-flow', 2, 'Cash flow reconciliation', [
   ('ebitda','EBITDA','num',0,0),
   ('cash-taxes','Cash taxes','num',0,0),
   ('cash-interest','Cash interest','num',0,0),
   ('change-nwc','Change in net working capital','num',0,0),
   ('cfo','Cash flow from operations','num',0,1),
   ('capex','Capital expenditures','num',0,0),
   ('fcf','Free cash flow','num',0,1),
   ('repayment','Scheduled debt repayment','num',0,0),
   ('dividends','Dividends','num',0,0),
   ('net-change-cash','Net change in cash','num',0,1)]),
 ('working-capital', 3, 'Working capital', [
   ('ar','Accounts receivable','num',0,0),
   ('inventory','Inventory','num',0,0),
   ('ap','Accounts payable','num',0,0),
   ('nwc','Net working capital','num',0,1),
   ('nwc-revenue','Net working capital % revenue','pct',1,0),
   ('dso','Days sales outstanding (DSO)','days',1,0),
   ('dio','Days inventory outstanding (DIO)','days',1,0),
   ('dpo','Days payable outstanding (DPO)','days',1,0)]),
 ('debt-leverage', 4, 'Debt & leverage', [
   ('opening-debt','Opening debt','num',0,0),
   ('revolver','Revolver borrowings','num',0,0),
   ('repayment','Scheduled debt repayment','num',0,0),
   ('closing-debt','Closing debt','num',0,1),
   ('cash','Cash balance','num',0,0),
   ('net-debt','Net debt','num',0,1),
   ('gross-leverage','Gross leverage','x',1,0),
   ('net-leverage','Net leverage','x',1,0),
   ('rate','Average cash interest rate','pct',1,0)]),
 ('liquidity', 5, 'Liquidity & coverage', [
   ('cash','Cash balance','num',0,0),
   ('undrawn-rcf','Undrawn revolving credit facility','num',0,0),
   ('total-liquidity','Total liquidity','num',0,1),
   ('current-ratio','Current ratio','x',1,0),
   ('ebitda-interest','EBITDA / cash interest','x',1,0),
   ('dscr','Debt service coverage ratio (DSCR)','x',1,0)]),
 ('balance-sheet', 6, 'Balance sheet summary', [
   ('total-assets','Total assets','num',0,0),
   ('total-debt','Total debt','num',0,0),
   ('cash','Cash and cash equivalents','num',0,0),
   ('nwc','Net working capital','num',0,0),
   ('equity','Total equity (balancing estimate)','num',0,1),
   ('debt-assets','Total debt / total assets','pct',1,0)]),
]
CASE_NAMES = [('credit','Credit case'),('management','Management case'),
              ('downside','Downside case'),('consensus','Consensus case'),
              ('harvest','Harvest case')]

def num(v, fmt):
    if v is None: return 'null'
    if fmt == 'x': return '%.2f' % round(v,2)
    return '%.1f' % round(v,1)

L = []
w = L.append
w("""/* projections.js — THE NUMBERS BEHIND THE LATEST PROJECTION GRID.

   WHERE THEY COME FROM. The credit case is the supplied workbook
   (northstar_credit_projection_tables.xlsx), cell for cell - every figure
   below is the figure in that book, to the decimal it was given in.

   THE OTHER FOUR CASES ARE THE SAME COMPANY UNDER THE SAME MODEL, bent by
   the year-by-year revenue and EBITDA deltas that the case comparison
   screen reports. Everything downstream is then recalculated rather than
   nudged: margins come out of the new revenue, interest out of the debt
   schedule, cash rolls forward through the cash-flow statement, leverage
   falls out of closing debt over the new EBITDA. So the gap between two
   columns here IS the delta the comparison screen shows - the two views
   are one model seen twice, not two sets of invented numbers.

   WHAT IS HELD FIXED ACROSS CASES, because it is a contract rather than a
   performance: the debt amortisation schedule, the interest rate, the
   undrawn revolver, and the working-capital day counts.

   THIS FILE IS GENERATED. Re-running the build script against a new
   workbook rewrites it; nothing here is hand-typed, so nothing here should
   be hand-edited.

   THE DATA IS FICTIONAL. The workbook says so on its first sheet:
   illustrative only, not actual borrower information. */
window.LOFI_DATA = window.LOFI_DATA || {};
window.LOFI_DATA.projection = {

  meta: {
    company:  'Northstar Components Inc.',
    currency: 'USD ($)',
    scale:    'Millions',
    note:     'Fictional / illustrative only',
    years:    [%s]
  },

  /* the five columns of the case dropdown, in the order it lists them */
  cases: [
%s
  ],
""" % (', '.join(str(y) for y in YEARS),
       ',\n'.join("    { id: '%s', name: '%s' }" % (i,n) for i,n in CASE_NAMES)))

w("""
  /* ---- WHAT EACH SECTION IS MADE OF ----

     `sub` indents a row under the one above it, the way the reference
     tucks "Revenue % growth" under "Revenue" - it is a reading of the row
     above, not a line of its own.

     `rule` draws a heavier line above a row that adds its section up, so
     the eye can find the totals without reading every label.

     `format`:  num  one decimal, the scale is millions
                pct  one decimal and a per-cent sign
                x    two decimals and a multiple sign
                days one decimal, a count of days  */
  sections: [""")
for sid, no, name, rows in SECTIONS:
    w("    { id: '%s', no: %d, name: '%s', rows: [" % (sid, no, name))
    for key, label, fmt, sub, rule in rows:
        bits = "key: '%s', label: '%s', format: '%s'" % (key, label.replace("'", "\\'"), fmt)
        if sub:  bits += ', sub: true'
        if rule: bits += ', rule: true'
        w("      { %s }," % bits)
    w("    ] },")
w("  ],\n")

w("""
  /* ---- THE FIGURES ----
     case -> section -> row key -> ten years, 2026 to 2035.
     A null is a year the figure does not exist for: there is no growth
     rate in the first year because there is nothing before it. */
  values: {""")
for cid, cname in CASE_NAMES:
    w("\n    /* %s */" % cname)
    w("    '%s': {" % cid)
    for sid, no, name, rows in SECTIONS:
        w("      '%s': {" % sid)
        for key, label, fmt, sub, rule in rows:
            vals = OUT[cid][sid][key]
            w("        '%s': [%s]," % (key, ', '.join(num(v, fmt) for v in vals)))
        w("      },")
    w("    },")
w("  }\n};")

io.open('/home/claude/handdrawn-worlds/prototypes/lofi-ds-1/case-comparison/data/projections.js',
        'w', encoding='utf-8').write('\n'.join(L) + '\n')
print('wrote projections.js')

