// client/src/app/(store)/Sidebar.tsx

export default async function Sidebar() {
  return (
    <div className="w-md h-[calc(100dvh-(var(--header-height)))] bg-sidebar p-4">
      <h3 className="text-xl">Sidebar</h3>
    </div>
  );
}
