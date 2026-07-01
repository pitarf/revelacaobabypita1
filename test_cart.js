async function test() {
  const res = await fetch("http://localhost:3000/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "test-session",
      giftId: "556f10c5-3d6a-4ddf-957e-11223d49376b",
      action: "add",
      quantity: 1,
      customPrice: 150
    })
  });
  const data = await res.json();
  console.log(data);
}
test();
