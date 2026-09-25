import React, { useEffect, useState } from 'react';
import { 
  LogOut, 
  Activity, 
  Users, 
  DollarSign, 
  AlertTriangle, 
  TrendingUp, 
  MapPin, 
  Layers, 
  ShoppingBag,
  Building2,
  PackageCheck
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const AdminDashboard = ({ onLogout }) => {
  const [dashboardData, setDashboardData] = useState({
    total_revenue: 0,
    active_rentals: 0,
    at_risk_customers: [],
    sales_analytics: null
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/admin/dashboard/');
        if (response.ok) {
          const data = await response.json();
          setDashboardData(data);
        }
      } catch (error) {
        console.error("Failed to fetch admin data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    if (onLogout) onLogout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', background: 'var(--bg-color)' }}>
        <div style={{ color: 'var(--primary-color)', fontWeight: 600 }}>Loading Admin Dashboard & Market Analytics...</div>
      </div>
    );
  }

  const sales = dashboardData.sales_analytics || {};

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', paddingBottom: '4rem' }}>
      {/* Top Navigation */}
      <nav className="panel" style={{ borderRadius: '0', position: 'sticky', top: 0, zIndex: 50, borderTop: 'none', borderLeft: 'none', borderRight: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <div style={{ background: 'var(--secondary-color)', padding: '0.5rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={22} color="white" />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--secondary-color)' }}>
                RentAI <span style={{ color: 'var(--primary-color)' }}>Admin</span>
              </h2>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: 500 }}>Customer View</Link>
            <button onClick={handleLogout} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="container animate-fade-in" style={{ marginTop: '2.5rem' }}>
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Enterprise Analytics & Retention</h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              Live rental operations, store sales market insights ({sales.appliance_furniture_records ? `${sales.appliance_furniture_records.toLocaleString()} records` : 'active'}), and ML-driven churn predictions.
            </p>
          </div>
          {sales.dataset_name && (
            <div style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.8rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <PackageCheck size={14} color="#0284c7" />
              Dataset: <strong>{sales.dataset_name}</strong>
            </div>
          )}
        </div>

        {/* Primary Operational KPIs */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ background: '#f0fdf4', padding: '0.85rem', borderRadius: '0.75rem' }}>
              <DollarSign size={28} color="#16a34a" />
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Total Rental Revenue</p>
              <h3 style={{ fontSize: '1.65rem', margin: 0 }}>₹{dashboardData.total_revenue.toLocaleString()}</h3>
            </div>
          </div>
          
          <div className="panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ background: '#eff6ff', padding: '0.85rem', borderRadius: '0.75rem' }}>
              <Users size={28} color="#2563eb" />
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Active Rentals</p>
              <h3 style={{ fontSize: '1.65rem', margin: 0 }}>{dashboardData.active_rentals}</h3>
            </div>
          </div>
          
          <div className="panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ background: '#fef2f2', padding: '0.85rem', borderRadius: '0.75rem' }}>
              <AlertTriangle size={28} color="var(--primary-color)" />
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>At-Risk Customers</p>
              <h3 style={{ fontSize: '1.65rem', margin: 0 }}>{dashboardData.at_risk_customers.length}</h3>
            </div>
          </div>

          <div className="panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ background: '#faf5ff', padding: '0.85rem', borderRadius: '0.75rem' }}>
              <TrendingUp size={28} color="#9333ea" />
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Market Sales Volume</p>
              <h3 style={{ fontSize: '1.65rem', margin: 0 }}>
                {sales.total_sales_volume ? `₹${(sales.total_sales_volume / 10000000).toFixed(1)} Cr` : '₹0'}
              </h3>
            </div>
          </div>
        </section>

        {/* Store Sales & Market Analytics Grid */}
        {sales.categories && (
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
            
            {/* Category Performance Card */}
            <div className="panel" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={20} color="#0284c7" />
                  <h2 style={{ fontSize: '1.15rem', margin: 0 }}>Category Sales Distribution</h2>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Electric & Furniture</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {sales.categories.map((cat, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--secondary-color)' }}>{cat.category}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        ₹{(cat.total_sales / 10000000).toFixed(2)} Cr ({cat.percentage}%) • {cat.order_count.toLocaleString()} orders
                      </span>
                    </div>
                    <div style={{ background: '#e2e8f0', borderRadius: '999px', height: '10px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          width: `${cat.percentage}%`, 
                          background: idx === 0 ? 'linear-gradient(90deg, #0284c7, #38bdf8)' : 'linear-gradient(90deg, #10b981, #34d399)', 
                          height: '100%', 
                          borderRadius: '999px' 
                        }} 
                      />
                    </div>
                    {/* Sub-categories */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.6rem' }}>
                      {cat.sub_categories?.slice(0, 4).map((sub, sIdx) => (
                        <span key={sIdx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.35rem', padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: '#475569' }}>
                          {sub.sub_category}: ₹{(sub.total_sales / 100000).toFixed(1)}L ({sub.order_count})
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Regional & City Tiers Card */}
            <div className="panel" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={20} color="#ea580c" />
                  <h2 style={{ fontSize: '1.15rem', margin: 0 }}>Top Regional Markets (India)</h2>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>By Sales Revenue</span>
              </div>

              {/* City Tier Pills */}
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {sales.city_tiers?.map((tier, idx) => (
                  <div key={idx} style={{ flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.6rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>{tier.city_type}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--secondary-color)', marginTop: '0.15rem' }}>{tier.share_pct}%</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{tier.orders.toLocaleString()} orders</div>
                  </div>
                ))}
              </div>

              {/* Top States List */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {sales.top_states?.slice(0, 6).map((st, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--secondary-color)' }}>{st.state}</span>
                    <span style={{ color: '#0284c7', fontWeight: 600 }}>₹{(st.sales / 10000000).toFixed(1)} Cr</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Live Store Sales Transactions Stream */}
        {sales.recent_transactions && sales.recent_transactions.length > 0 && (
          <section className="panel" style={{ overflow: 'hidden', marginBottom: '3rem' }}>
            <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid var(--border-color)', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', margin: 0 }}>Recent Market Orders Stream</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem', margin: 0 }}>
                  Real transaction logs ingested from store sales data across Indian cities.
                </p>
              </div>
              <span style={{ fontSize: '0.8rem', background: '#e0f2fe', color: '#0369a1', padding: '0.25rem 0.65rem', borderRadius: '1rem', fontWeight: 600 }}>
                Live Stream
              </span>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'white', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '0.85rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Order ID</th>
                    <th style={{ padding: '0.85rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Customer</th>
                    <th style={{ padding: '0.85rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Item</th>
                    <th style={{ padding: '0.85rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Location</th>
                    <th style={{ padding: '0.85rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Date</th>
                    <th style={{ padding: '0.85rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Amount</th>
                    <th style={{ padding: '0.85rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.recent_transactions.slice(0, 8).map((tx, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', background: idx % 2 === 0 ? 'white' : '#f8fafc', fontSize: '0.875rem' }}>
                      <td style={{ padding: '0.75rem 1.5rem', fontWeight: 600, color: '#0284c7' }}>{tx.order_id}</td>
                      <td style={{ padding: '0.75rem 1.5rem' }}>{tx.customer_name}</td>
                      <td style={{ padding: '0.75rem 1.5rem' }}>
                        <div style={{ fontWeight: 600 }}>{tx.product_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{tx.sub_category}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1.5rem' }}>
                        <div>{tx.state}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{tx.city_type}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1.5rem', color: 'var(--text-secondary)' }}>{tx.order_date}</td>
                      <td style={{ padding: '0.75rem 1.5rem', fontWeight: 700 }}>₹{tx.sales.toLocaleString()}</td>
                      <td style={{ padding: '0.75rem 1.5rem', color: tx.profit >= 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                        ₹{tx.profit.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* High Churn Risk Customers Table (LightGBM + SHAP) */}
        <section className="panel" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)', background: '#f8fafc' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>High Churn Risk Customers</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Customers with &gt;50% probability of leaving, powered by LightGBM and SHAP.</p>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'white', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem 2rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>User</th>
                  <th style={{ padding: '1rem 2rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Risk Score</th>
                  <th style={{ padding: '1rem 2rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>SHAP Reason (AI Insight)</th>
                  <th style={{ padding: '1rem 2rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.at_risk_customers.length > 0 ? (
                  dashboardData.at_risk_customers.map((customer, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', background: idx % 2 === 0 ? 'white' : '#f8fafc' }}>
                      <td style={{ padding: '1rem 2rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--secondary-color)' }}>{customer.username}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{customer.email}</div>
                      </td>
                      <td style={{ padding: '1rem 2rem' }}>
                        <div style={{ 
                          display: 'inline-flex', alignItems: 'center', 
                          background: customer.churn_risk_score > 0.8 ? '#fef2f2' : '#fff7ed', 
                          color: customer.churn_risk_score > 0.8 ? 'var(--primary-color)' : '#ea580c',
                          padding: '0.25rem 0.75rem', borderRadius: '1rem', fontWeight: 700, fontSize: '0.875rem'
                        }}>
                          {(customer.churn_risk_score * 100).toFixed(1)}%
                        </div>
                      </td>
                      <td style={{ padding: '1rem 2rem', color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '300px' }}>
                        {customer.shap_reason}
                      </td>
                      <td style={{ padding: '1rem 2rem' }}>
                        <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                          Intervene
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No customers are currently at high risk. Great job!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
