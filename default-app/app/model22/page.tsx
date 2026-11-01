'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface IssueVoucherItem {
  id?: string;
  itemId?: string;
  itemName: string;
  description?: string;
  model?: string;
  serialNumber?: string;
  unit: string;
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  condition?: string;
}

interface IssueVoucher {
  id?: string;
  voucherNumber: string;
  recipientName: string;
  recipientId?: string;
  department?: string;
  requisitionNumber?: string;
  issueDate: string;
  purpose?: string;
  remarks?: string;
  issuedBy?: string;
  approvedBy?: string;
  storekeeperName?: string;
  receivedBy?: string;
  pageFrom?: number;
  pageTo?: number;
  status: string;
  totalValue?: number;
  items: IssueVoucherItem[];
}

export default function Model22Page() {
  const { status } = useSession();
  
  const [vouchers, setVouchers] = useState<IssueVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  // Form state
  const [formData, setFormData] = useState<IssueVoucher>({
    voucherNumber: '',
    recipientName: '',
    recipientId: '',
    department: '',
    requisitionNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    purpose: '',
    remarks: '',
    issuedBy: '',
    approvedBy: '',
    storekeeperName: '',
    receivedBy: '',
    status: 'COMPLETED',
    items: [],
  });

  const [currentItem, setCurrentItem] = useState<IssueVoucherItem>({
    itemName: '',
    unit: 'PCS',
    quantity: 1,
    unitCost: 0,
    condition: 'GOOD',
  });

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      const response = await fetch('/api/model22');
      if (response.ok) {
        const data = await response.json();
        setVouchers(data);
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateVoucherNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `M22-${year}${month}-${random}`;
  };

  const handleAddItem = () => {
    if (!currentItem.itemName || currentItem.quantity <= 0) {
      alert('Please fill in item name and valid quantity');
      return;
    }

    const totalCost = currentItem.quantity * (currentItem.unitCost || 0);
    
    setFormData({
      ...formData,
      items: [...formData.items, { ...currentItem, totalCost }],
    });

    setCurrentItem({
      itemName: '',
      unit: 'PCS',
      quantity: 1,
      unitCost: 0,
      condition: 'GOOD',
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.voucherNumber || !formData.recipientName || formData.items.length === 0) {
      alert('Please fill in required fields: Voucher Number, Recipient Name, and at least one item');
      return;
    }

    try {
      const response = await fetch('/api/model22', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Model 22 Issue Voucher created successfully!');
        setShowForm(false);
        fetchVouchers();
        setFormData({
          voucherNumber: '',
          recipientName: '',
          recipientId: '',
          department: '',
          requisitionNumber: '',
          issueDate: new Date().toISOString().split('T')[0],
          purpose: '',
          remarks: '',
          issuedBy: '',
          approvedBy: '',
          storekeeperName: '',
          receivedBy: '',
          status: 'COMPLETED',
          items: [],
        });
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to create voucher'}`);
      }
    } catch (error) {
      console.error('Error creating voucher:', error);
      alert('Failed to create voucher');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-slate-500 text-sm">
        Loading…
      </div>
    );
  }

  const totalValue = formData.items.reduce((sum, item) => sum + (item.totalCost || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Model 22 — Issue voucher</h1>
          <p className="text-slate-600 text-sm mt-1">Multi-line issue voucher with recipient and authorization details.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowForm(!showForm);
            if (!showForm) {
              setFormData({
                ...formData,
                voucherNumber: generateVoucherNumber(),
              });
            }
          }}
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium"
        >
          {showForm ? 'Cancel' : 'New voucher'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold mb-6 text-slate-900">Create issue voucher</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Voucher Number *
                </label>
                <input
                  type="text"
                  value={formData.voucherNumber}
                  onChange={(e) => setFormData({ ...formData, voucherNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Issue Date *
                </label>
                <input
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  value={formData.recipientName}
                  onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Requisition Number
                </label>
                <input
                  type="text"
                  value={formData.requisitionNumber}
                  onChange={(e) => setFormData({ ...formData, requisitionNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Purpose
                </label>
                <input
                  type="text"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Issued By
                </label>
                <input
                  type="text"
                  value={formData.issuedBy}
                  onChange={(e) => setFormData({ ...formData, issuedBy: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Storekeeper Name
                </label>
                <input
                  type="text"
                  value={formData.storekeeperName}
                  onChange={(e) => setFormData({ ...formData, storekeeperName: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Remarks
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Add Items Section */}
            <div className="border-t pt-6 mb-6">
              <h3 className="text-base font-semibold mb-4 text-slate-900">Line items</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    value={currentItem.itemName}
                    onChange={(e) => setCurrentItem({ ...currentItem, itemName: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter item name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Unit
                  </label>
                  <select
                    value={currentItem.unit}
                    onChange={(e) => setCurrentItem({ ...currentItem, unit: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PCS">PCS</option>
                    <option value="BOX">BOX</option>
                    <option value="KG">KG</option>
                    <option value="L">L</option>
                    <option value="M">M</option>
                    <option value="SET">SET</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    value={currentItem.quantity}
                    onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Unit Cost
                  </label>
                  <input
                    type="number"
                    value={currentItem.unitCost}
                    onChange={(e) => setCurrentItem({ ...currentItem, unitCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 rounded-lg text-sm font-medium"
              >
                + Add Item
              </button>
            </div>

            {/* Items List */}
            {formData.items.length > 0 && (
              <div className="mb-6">
                <h3 className="text-base font-semibold mb-4 text-slate-900">Items ({formData.items.length})</h3>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-slate-200 rounded-lg text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Item Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Unit</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Quantity</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Unit Cost</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, index) => (
                        <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-800">{item.itemName}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.unit}</td>
                          <td className="px-4 py-3 text-sm text-gray-800 text-right">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-gray-800 text-right">
                            {item.unitCost?.toFixed(2)} ETB
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                            {item.totalCost?.toFixed(2)} ETB
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-600 hover:text-red-800 font-medium"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                        <td colSpan={4} className="px-4 py-3 text-right text-sm">
                          Total Value:
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-blue-600">
                          {totalValue.toFixed(2)} ETB
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                disabled={formData.items.length === 0}
              >
                Create Issue Voucher
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vouchers List */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold mb-6 text-slate-900">Voucher history</h2>
        
        {vouchers.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            <p>No issue vouchers recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Voucher #</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Recipient</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Department</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Items</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total Value</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {vouchers.map((voucher) => (
                  <tr key={voucher.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-blue-600">{voucher.voucherNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(voucher.issueDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">{voucher.recipientName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{voucher.department || '-'}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-800">{voucher.items.length}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-800">
                      {voucher.totalValue?.toFixed(2) || '0.00'} ETB
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        voucher.status === 'COMPLETED' 
                          ? 'bg-green-100 text-green-800' 
                          : voucher.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {voucher.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
