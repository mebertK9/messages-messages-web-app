export default function DashboardPage() {
      const user = JSON.parse(
          localStorage.getItem("currentUser") || "{}"
            );
            
return (
  <div style={{ padding: 24 }}>
    <h1>Willkommen {user.name}</h1>

<p>Login erfolgreich.</p>
</div>
);
}
