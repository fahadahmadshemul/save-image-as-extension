const formats = ["jpg", "png", "webp", "pdf", "doc"];

chrome.runtime.onInstalled.addListener(() => {
  formats.forEach(format => {
    chrome.contextMenus.create({
      id: format,
      title: `Save Image As ${format.toUpperCase()}`,
      contexts: ["image"]
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["jspdf.umd.min.js"] // jsPDF needs to be injected
  }, () => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: saveImage,
      args: [info.srcUrl, info.menuItemId]
    });
  });
});

function saveImage(imageUrl, format) {
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    chrome.runtime.sendMessage({ url, filename });
  }

  fetch(imageUrl)
    .then(res => res.blob())
    .then(blob => {
      const reader = new FileReader();
      reader.onload = function () {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = async () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);

          if (format === "pdf") {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
              orientation: img.width > img.height ? "landscape" : "portrait",
              unit: "px",
              format: [img.width, img.height]
            });

            const dataUrl = canvas.toDataURL("image/jpeg", 1.0);
            pdf.addImage(dataUrl, "JPEG", 0, 0, img.width, img.height);

            const pdfBlob = pdf.output("blob");
            downloadBlob(pdfBlob, "image.pdf");
          } else {
            const dataURL = canvas.toDataURL(`image/${format}`);
            const base64 = atob(dataURL.split(",")[1]);
            const array = new Uint8Array(base64.length);
            for (let i = 0; i < base64.length; i++) {
              array[i] = base64.charCodeAt(i);
            }
            const blob = new Blob([array], { type: `image/${format}` });
            downloadBlob(blob, `image.${format}`);
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(blob);
    });
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.url && message.filename) {
    chrome.downloads.download({
      url: message.url,
      filename: message.filename,
      saveAs: true
    });
  }
});
