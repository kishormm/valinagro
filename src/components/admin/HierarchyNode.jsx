
export default function HierarchyNode({ user }) {
  return (
    <div className="pl-6 border-l-2 border-green-200">
      <div className="py-2">
        <div className="bg-green-50 border border-green-200 p-3 rounded-md inline-block">
          <p className="font-bold text-green-900">{user.name}</p>
          <p className="text-sm text-black">{user.userId} ({user.role})</p>
        </div>
      </div>
      
      {user.children && user.children.length > 0 && (
        <div className="relative">
          {user.children.map(child => (
            <HierarchyNode key={child.userId} user={child} />
          ))}
        </div>
      )}
    </div>
  );
}