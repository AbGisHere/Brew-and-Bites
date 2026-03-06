# PowerShell script to fix AdminDashboard.jsx
$content = Get-Content "AdminDashboard.jsx" -Raw
$fix = @"
      </div>

      {/* Payment Modal */}
      <PaymentModal
        open={paymentModal.open}
        onClose={() => setPaymentModal({ open: false, receipt: null })}
        receipt={paymentModal.receipt}
        onPaymentComplete={handlePaymentComplete}
        tableMap={tableMap}
      />
    </div>
"@
$content = $content.Replace("      </div>`n    </div>", $fix)
$content | Set-Content "AdminDashboard.jsx"
