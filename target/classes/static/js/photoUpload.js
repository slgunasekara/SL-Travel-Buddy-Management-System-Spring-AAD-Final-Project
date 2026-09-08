const PhotoUpload = (() => {
    const MAX_SIZE_BYTES = 8 * 1024 * 1024; // matches spring.servlet.multipart.max-file-size
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];


    const activeObjectUrls = new Set();

    function trackObjectUrl(url) {
        activeObjectUrls.add(url);
        return url;
    }


    function renderField(fieldName, currentFileName) {
        const inputId = `photoInput_${fieldName}`;
        const previewId = `photoPreview_${fieldName}`;
        const hiddenId = `photoFileName_${fieldName}`;
        return `
      <div class="photo-upload" data-field="${fieldName}">
        <input type="hidden" id="${hiddenId}" value="${currentFileName ? Fmt.escapeHtml(currentFileName) : ""}" />
        <div class="photo-upload__zone" id="${previewId}">
          <span class="photo-upload__placeholder">No photo attached</span>
        </div>
        <div class="photo-upload__actions">
          <label class="btn btn--ghost btn--sm" for="${inputId}">📷 ${currentFileName ? "Replace Photo" : "Attach Photo"}</label>
          <button type="button" class="btn btn--ghost btn--sm photo-upload__remove" style="display:none;">Remove</button>
          <input type="file" id="${inputId}" accept="image/jpeg,image/png,image/webp,image/gif" class="file-input-hidden" />
        </div>
      </div>`;
    }


    function wire(container, fieldName, onChange) {
        const root = container.querySelector(`.photo-upload[data-field="${fieldName}"]`);
        if (!root) return function setValue() {
        };
        const input = root.querySelector(`#photoInput_${fieldName}`);
        const hidden = root.querySelector(`#photoFileName_${fieldName}`);
        const preview = root.querySelector(`#photoPreview_${fieldName}`);
        const removeBtn = root.querySelector(".photo-upload__remove");
        const label = root.querySelector("label");

        async function renderThumbnail(fileName) {
            if (!fileName) {
                preview.innerHTML = `<span class="photo-upload__placeholder">No photo attached</span>`;
                removeBtn.style.display = "none";
                label.textContent = "📷 Attach Photo";
                return;
            }
            removeBtn.style.display = "";
            label.textContent = "📷 Replace Photo";
            preview.innerHTML = `<span class="photo-upload__placeholder">Loading…</span>`;
            try {
                const blob = await apiFetchBlob(`/v1/photos/${encodeURIComponent(fileName)}`);
                const url = trackObjectUrl(URL.createObjectURL(blob));
                preview.innerHTML = `<img src="${url}" alt="Attached photo" class="photo-upload__img" title="Click to view full size" />`;

                preview.querySelector("img").addEventListener("click", () => openLightbox(fileName));
            } catch (err) {
                preview.innerHTML = `<span class="photo-upload__placeholder photo-upload__placeholder--error">Couldn't load photo</span>`;
            }
        }

        input.addEventListener("change", async () => {
            const file = input.files[0];
            input.value = "";
            if (!file) return;

            if (!ALLOWED_TYPES.includes(file.type)) {
                Toast.error("Only JPEG, PNG, WEBP, or GIF images are allowed.");
                return;
            }
            if (file.size > MAX_SIZE_BYTES) {
                Toast.error("That photo is too large — the limit is 8 MB.");
                return;
            }

            preview.innerHTML = `<span class="photo-upload__placeholder">Uploading…</span>`;
            try {
                const res = await apiUploadFile("/v1/photos/upload", file);
                const fileName = res.body.fileName;
                hidden.value = fileName;
                await renderThumbnail(fileName);
                if (onChange) onChange(fileName);
            } catch (err) {
                Toast.error(apiErrorMessage(err, "Failed to upload the photo."));
                await renderThumbnail(hidden.value || null);
            }
        });

        removeBtn.addEventListener("click", () => {
            hidden.value = "";
            renderThumbnail(null);
            if (onChange) onChange(null);
        });

        renderThumbnail(hidden.value || null);

        return function setValue(fileName) {
            hidden.value = fileName || "";
            renderThumbnail(fileName || null);
        };
    }


    function reset(container, fieldName) {
        const root = container.querySelector(`.photo-upload[data-field="${fieldName}"]`);
        if (!root) return;
        root.querySelector(`#photoFileName_${fieldName}`).value = "";
        root.querySelector(`#photoPreview_${fieldName}`).innerHTML = `<span class="photo-upload__placeholder">No photo attached</span>`;
        root.querySelector(".photo-upload__remove").style.display = "none";
        root.querySelector("label").textContent = "📷 Attach Photo";
    }

    function getValue(container, fieldName) {
        const hidden = container.querySelector(`#photoFileName_${fieldName}`);
        return hidden && hidden.value ? hidden.value : null;
    }


    async function openLightbox(fileName) {
        const overlay = document.createElement("div");
        overlay.className = "photo-lightbox";
        overlay.innerHTML = `
      <button class="photo-lightbox__close" aria-label="Close">&times;</button>
      <div class="photo-lightbox__body"><span class="photo-lightbox__loading">Loading…</span></div>`;
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add("show"));

        function close() {
            overlay.classList.remove("show");
            document.removeEventListener("keydown", onKey);
            setTimeout(() => overlay.remove(), 200);
        }

        function onKey(e) {
            if (e.key === "Escape") close();
        }

        document.addEventListener("keydown", onKey);
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) close();
        });
        overlay.querySelector(".photo-lightbox__close").addEventListener("click", close);

        try {
            const blob = await apiFetchBlob(`/v1/photos/${encodeURIComponent(fileName)}`);
            const url = trackObjectUrl(URL.createObjectURL(blob));
            overlay.querySelector(".photo-lightbox__body").innerHTML = `<img src="${url}" alt="Full size photo" />`;
        } catch (err) {
            overlay.querySelector(".photo-lightbox__body").innerHTML = `<span class="photo-lightbox__loading">Couldn't load this photo.</span>`;
        }
    }


    async function renderTableThumbnail(hostEl, fileName) {
        if (!fileName) {
            hostEl.innerHTML = `<span class="muted">-</span>`;
            return;
        }
        hostEl.innerHTML = `<span class="photo-thumb-loading">…</span>`;
        try {
            const blob = await apiFetchBlob(`/v1/photos/${encodeURIComponent(fileName)}`);
            const url = trackObjectUrl(URL.createObjectURL(blob));
            hostEl.innerHTML = `<img src="${url}" class="photo-thumb" alt="Photo" title="Click to view full size" />`;
            hostEl.querySelector("img").addEventListener("click", () => openLightbox(fileName));
        } catch (err) {
            hostEl.innerHTML = `<span class="muted">-</span>`;
        }
    }

    return {renderField, wire, reset, getValue, openLightbox, renderTableThumbnail};
})();
