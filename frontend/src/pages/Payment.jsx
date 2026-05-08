import { useEffect, useState } from "react";
import { getErrorMessage, getToken } from "../services/authService";
import { getWallet, addMoney } from "../services/walletService";
import "../styles/payment.css";

function Payment() {
  const token = getToken();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addMoneyAmount, setAddMoneyAmount] = useState("");
  const [addMoneyLoading, setAddMoneyLoading] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadWallet = async () => {
      try {
        const data = await getWallet(token);
        setWallet(data.wallet);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    loadWallet();
  }, [token]);

  const handleAddMoney = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!addMoneyAmount || addMoneyAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    setAddMoneyLoading(true);

    try {
      const data = await addMoney(parseFloat(addMoneyAmount), token);
      setSuccess(data.message || "Money added successfully!");
      setWallet(data.wallet);
      setAddMoneyAmount("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAddMoneyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrap">
        <div className="card payment-card">
          <p className="muted">Loading wallet...</p>
        </div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="page-wrap">
        <div className="card payment-card">
          <p className="error">Wallet not found. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <div className="card payment-card">
        <div className="payment-header">
          <h2>Wallet & Payments</h2>
        </div>

        {error ? <p className="error">{error}</p> : null}
        {success ? <p className="success">{success}</p> : null}

        <div className="wallet-section">
          <div className="balance-box">
            <span className="balance-label">Current Balance</span>
            <div className="balance-amount">₹{wallet.balance?.toFixed(2)}</div>
          </div>

          <form className="add-money-form" onSubmit={handleAddMoney}>
            <h3>Add Money (Demo)</h3>
            <p className="muted">Add demo funds to your wallet for testing purposes.</p>

            <div className="form-group">
              <label htmlFor="addMoneyAmount">Amount (₹)</label>
              <input
                id="addMoneyAmount"
                type="number"
                step="0.01"
                min="0"
                value={addMoneyAmount}
                onChange={(event) => setAddMoneyAmount(event.target.value)}
                placeholder="Enter amount"
              />
            </div>

            <button
              type="submit"
              className="btn primary"
              disabled={addMoneyLoading}
            >
              {addMoneyLoading ? "Adding..." : "Add Money"}
            </button>
          </form>
        </div>

        <div className="transaction-section">
          <h3>Recent Transactions</h3>

          {!wallet.transactions || wallet.transactions.length === 0 ? (
            <p className="muted">No transactions yet.</p>
          ) : (
            <div className="transaction-list">
              {wallet.transactions.map((transaction, index) => (
                <div className="transaction-item" key={index}>
                  <div className="transaction-info">
                    <span className="transaction-desc">{transaction.description}</span>
                    <span className="transaction-date">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={`transaction-amount ${transaction.type}`}>
                    {transaction.type === "debit" ? "-" : "+"}₹
                    {transaction.amount?.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Payment;
