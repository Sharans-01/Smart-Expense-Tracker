export default function ExpenseCard({ data, onDelete }) {
  return (
    <div className="bg-white shadow p-3 rounded mb-2 flex justify-between">
      <div>
        <p className="font-bold">₹{data.amount}</p>
        <p className="text-sm text-gray-500">{data.category}</p>
        <p className="text-xs">{data.type}</p>
      </div>

      <button onClick={() => onDelete(data.id)}
        className="text-red-500">
        Delete
      </button>
    </div>
  );
}