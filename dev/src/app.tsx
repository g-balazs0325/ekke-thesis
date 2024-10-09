import { createRoot } from "react-dom/client";

const root = createRoot(document.getElementById("root"));
const MyApp = () => {
  return <h1>Hello World!</h1>;
};

root.render(<MyApp />);
