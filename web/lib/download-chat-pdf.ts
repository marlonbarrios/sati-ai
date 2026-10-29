import { ChatMessage } from "@/lib/types";

export async function downloadChatPdf(messages: ChatMessage[]) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);

  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-10000px";
  host.style.top = "0";
  host.style.width = "800px";
  host.style.padding = "40px";
  host.style.background = "#ffffff";
  host.style.color = "#1c1917";
  host.style.fontFamily = "Georgia, 'Times New Roman', serif";

  const title = document.createElement("h1");
  title.textContent = "Conversation with Sati-AI";
  title.style.fontSize = "28px";
  title.style.margin = "0 0 8px";
  host.appendChild(title);

  const when = document.createElement("p");
  when.textContent = new Date().toLocaleString();
  when.style.margin = "0 0 24px";
  when.style.color = "#57534e";
  host.appendChild(when);

  for (const message of messages) {
    if (!message.content.trim()) continue;
    const block = document.createElement("section");
    block.style.marginBottom = "20px";

    const who = document.createElement("h2");
    who.textContent = message.role === "assistant" ? "Sati-AI" : "You";
    who.style.fontSize = "14px";
    who.style.letterSpacing = "0.04em";
    who.style.margin = "0 0 6px";
    who.style.textTransform = "uppercase";

    const body = document.createElement("p");
    body.textContent = message.content;
    body.style.margin = "0";
    body.style.whiteSpace = "pre-wrap";
    body.style.lineHeight = "1.5";
    body.style.fontSize = "16px";

    block.append(who, body);
    host.appendChild(block);
  }

  document.body.appendChild(host);

  try {
    const canvas = await html2canvas(host, { scale: 2, backgroundColor: "#ffffff" });
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imageWidth = pageWidth;
    const imageHeight = (canvas.height * imageWidth) / canvas.width;
    const image = canvas.toDataURL("image/png");

    let heightLeft = imageHeight;
    let position = 0;
    pdf.addImage(image, "PNG", 0, position, imageWidth, imageHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imageHeight;
      pdf.addPage();
      pdf.addImage(image, "PNG", 0, position, imageWidth, imageHeight);
      heightLeft -= pageHeight;
    }

    const stamp = new Date().toISOString().slice(0, 10);
    pdf.save(`sati-conversation-${stamp}.pdf`);
  } finally {
    host.remove();
  }
}
