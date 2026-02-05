"use client";
import { useEffect, useState } from "react";

export default function AddressManager({ userEmail }: { userEmail: string }) {
  const [address, setAddress] = useState("");
  const [realName, setRealName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/address/me", { credentials: "include" })
      .then(async res => {
        let data = null;
        try {
          data = await res.json();
        } catch (e) {
          setError("Service exception, please try again later");
          setLoading(false);
          return;
        }
        if (data && data.address) {
          setAddress(data.address.address);
          setRealName(data.address.realName);
          setPhone(data.address.phone);
        } else if (data && data.error) {
          setError(data.error);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Network exception, please try again later");
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    const res = await fetch("/api/address/me", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, realName, phone }),
      credentials: "include"
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Save failed");
    } else {
      setSuccess("Save successful");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-md mx-auto mt-10 bg-white rounded-xl shadow-xl p-8">
      <h2 className="text-xl font-bold mb-6 text-center">Address Management</h2>
      <form className="flex flex-col gap-4" onSubmit={handleSave}>
        <input
          type="text"
          placeholder="Recipient Name"
          className="border rounded px-3 py-2"
          value={realName}
          onChange={e => setRealName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Contact Phone"
          className="border rounded px-3 py-2"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Shipping Address"
          className="border rounded px-3 py-2"
          value={address}
          onChange={e => setAddress(e.target.value)}
          required
        />
        <button type="submit" className="bg-blue-600 text-white rounded py-2 font-semibold">Save</button>
        {error && <div className="text-red-500 text-sm text-center mt-2">{error}</div>}
        {success && <div className="text-green-600 text-sm text-center mt-2">{success}</div>}
      </form>
    </div>
  );
}
