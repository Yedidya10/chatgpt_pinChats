(async () => {
  const getCurrentScheme = () => {
    return getComputedStyle(document.documentElement)
      .getPropertyValue("color-scheme")
      .trim();
  };
  const isDarkMode = getCurrentScheme() === "dark";

  // Function to create a pinned chat element
  function createPinnedChatElement(
    title: string,
    url: string,
    profileId: string
  ): HTMLLIElement {
    const li: HTMLLIElement = document.createElement("li");
    const a: HTMLAnchorElement = document.createElement("a");
    const span: HTMLSpanElement = document.createElement("span");
    const unpinChatBtn: HTMLButtonElement = document.createElement("button");

    // Define SVG icon for unpinning chat
    const svg =
      `
      <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill=` +
      (isDarkMode ? "#dedede80" : "#00000090") +
      `>
        <path d="M672-816v72h-48v307l-72-72v-235H408v91l-90-90-30-31v-42h384ZM480-48l-36-36v-228H240v-72l96-96v-42.46L90-768l51-51 678 679-51 51-222-223h-30v228l-36 36ZM342-384h132l-66-66-66 66Zm137-192Zm-71 126Z"/>
      </svg>
    `;
    unpinChatBtn.innerHTML = svg;
    unpinChatBtn.setAttribute("title", "Unpin chat");
    unpinChatBtn.style.backgroundColor = "transparent";
    unpinChatBtn.style.textDecoration = "none";
    unpinChatBtn.style.border = "none";
    unpinChatBtn.style.cursor = "pointer";
    unpinChatBtn.style.padding = "5px";
    unpinChatBtn.style.visibility = "hidden"; // Hidden by default
    unpinChatBtn.style.opacity = "0"; // Hidden by default
    unpinChatBtn.style.transition = "opacity 0.3s, visibility 0.3s";

    // Handle unpin chat button click
    async function handleUnpinChatBtnClick(event: MouseEvent) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      li.remove(); // Remove the pinned chat element profileId
      const profile = await chrome.storage.sync.get([`${profileId}`]);
      const pinnedChats = profile[`${profileId}`] || [];

      const index = pinnedChats.indexOf(url);
      if (index !== -1) {
        pinnedChats.splice(index, 1); // Remove the URL from pinned chats
        await chrome.storage.sync.set({ [`${profileId}`]: pinnedChats });
      }
    }

    // Set up the anchor link for the pinned chat
    a.href = `https://chatgpt.com${url}`;
    a.style.display = "flex";
    a.style.flexWrap = "nowrap";
    a.style.overflow = "hidden";
    a.style.textOverflow = "ellipsis";
    a.style.whiteSpace = "nowrap";
    a.style.maskImage = isDarkMode
      ? "linear-gradient(to right, rgba(0, 0, 0, 1) 90%, rgba(0, 0, 0, 0) 100%)"
      : "linear-gradient(to right, rgba(255, 255, 255, 1) 90%, rgba(255, 255, 255, 0) 100%)";
    a.style.flex = "1";
    a.style.alignItems = "center";
    a.style.padding = "8px";

    // Set up the span for the chat title
    span.style.textAlign = "left";
    span.style.fontSize = "0.9rem";
    span.title = title;
    span.textContent = title;

    // Append the elements to the list item
    li.appendChild(a);
    a.appendChild(span);
    li.appendChild(unpinChatBtn);

    // Add hover effect to the unpin button
    unpinChatBtn.addEventListener("mouseover", () => {
      const svg = unpinChatBtn.querySelector("svg");
      if (svg) {
        svg.style.fill = isDarkMode ? "#dedede" : "#000000";
      }
    });

    unpinChatBtn.addEventListener("mouseout", () => {
      const svg = unpinChatBtn.querySelector("svg");
      if (svg) {
        svg.style.fill = isDarkMode ? "#dedede70" : "#00000070";
      }
    });

    // Add the click handler for unpinning
    unpinChatBtn.addEventListener("click", handleUnpinChatBtnClick);

    // Style the list item and anchor
    li.style.listStyle = "none";
    li.style.width = "100%";
    li.style.display = "flex";
    li.style.alignItems = "center";
    li.style.justifyContent = "space-between";
    li.style.borderRadius = "8px";
    li.style.transition = "background-color 0.3s";
    if (`https://chatgpt.com${url}` === window.location.href) {
      li.style.backgroundColor = isDarkMode ? "#2F2F2F" : "#e3e3e3";
    } else {
      li.style.backgroundColor = "transparent";
    }

    // Add hover effect for the list item
    li.addEventListener("mouseover", () => {
      li.style.backgroundColor = isDarkMode ? "#212121" : "#ececec";
      unpinChatBtn.style.visibility = "visible";
      unpinChatBtn.style.opacity = "1";
    });

    li.addEventListener("mouseout", () => {
      li.style.backgroundColor = "transparent";
      unpinChatBtn.style.visibility = "hidden";
      unpinChatBtn.style.opacity = "0";

      if (`https://chatgpt.com${url}` === window.location.href) {
        li.style.backgroundColor = isDarkMode ? "#2F2F2F" : "#e3e3e3";
      }
    });

    li.addEventListener("mousedown", (event) => {
      event.preventDefault();
      li.style.backgroundColor = isDarkMode ? "#202020" : "#f0f0f0";
    });

    return li;
  }

  // Create the container for pinned chats
  const pinnedContainer: HTMLDivElement = document.createElement("div");
  pinnedContainer.innerHTML = `
    <div class="pinned-container" style="margin-top: 20px">
      <h3
        class="pinned-title"
        style="font-size: 0.8rem; font-weight: 500; margin-left: 8px"
      >
        Pinned Chats
      </h3>
      <ol
        id="pinnedChats"
        class="pinned-chats"
        style="
          padding: 0;
          margin: 0;
          list-style-type: none;
          display: flex;
          flex-direction: column;
          max-height: 150px;
          overflow-y: auto;
          overflow-x: hidden;
        "
      ></ol>
    </div>
  `;

  try {
    // Function to insert the pinned container into the sidebar
    function setPinnedContainer(): Promise<HTMLElement> {
      return new Promise<HTMLElement>((resolve) => {
        const interval = setInterval(async () => {
          const sidebar = document.querySelector(".group\\/sidebar");
          if (sidebar) {
            clearInterval(interval);

            if (sidebar.children.length >= 3) {
              const thirdChild = sidebar.children[2] as HTMLElement;
              if (thirdChild instanceof HTMLDivElement) {
                sidebar.insertBefore(pinnedContainer, thirdChild);
                const pinnedChats: HTMLUListElement =
                  pinnedContainer.querySelector(
                    "#pinnedChats"
                  ) as HTMLUListElement;

                // Load pinned chats from storage
                const profile = await chrome.storage.sync.get([`${profileId}`]);
                const pinnedChatsUrls: string[] = profile[`${profileId}`] || [];

                pinnedChatsUrls.forEach((url) => {
                  const chatElement = document.querySelector(
                    `a[href="${url}"]`
                  );
                  const chatTitle =
                    chatElement?.querySelector("div")?.textContent;

                  if (chatElement && chatTitle) {
                    const pinnedChat: HTMLLIElement = createPinnedChatElement(
                      chatTitle,
                      url,
                      profileId
                    );
                    pinnedChats.prepend(pinnedChat);
                  }
                });
              } else {
                console.warn("Third child is not a div element");
              }
            } else {
              console.warn("Sidebar does not have 3 children yet");
            }

            resolve(sidebar as HTMLElement);
          }
        }, 500);
      });
    }

    // Get the user ID from the local storage
    function getUserId(): string {
      const prefix = "cache/user";
      const matchingKeys = Object.keys(localStorage).filter((key) =>
        key.startsWith(prefix)
      );

      for (const key of matchingKeys) {
        const regex = /cache\/user-([a-zA-Z0-9]+)/;
        const match = key.match(regex);

        if (match) {
          return match[1];
        }
      }

      return "";
    }

    const profileId = getUserId();

    // Call the function to set the pinned container
    await setPinnedContainer();

    // Event listener for clicking on the chat options
    document.body.addEventListener("click", async (event) => {
      const target =
        event.target &&
        (event.target as HTMLElement).closest(
          '[data-testid^="history-item-"][data-testid$="-options"]'
        );

      if (target) {
        const liElement = target.closest("li");
        const chatElement =
          target.parentElement?.parentElement?.querySelector("a");
        const chatTitle = chatElement?.querySelector("div")?.textContent;
        const chatUrl = chatElement?.getAttribute("href");
        const menuContent = document.querySelectorAll(
          '[role="menu"], [role="dialog"]'
        )[1] as HTMLElement;

        if (menuContent) {
          const deleteButton = menuContent.querySelector(
            '[data-testid="delete-chat-menu-item"]'
          );

          if (deleteButton) {
            document.addEventListener("click", async () => {
              const deleteConversationConfirmButton = document.querySelector(
                '[data-testid="delete-conversation-confirm-button"]'
              ) as HTMLButtonElement;

              if (deleteConversationConfirmButton) {
                deleteConversationConfirmButton.addEventListener(
                  "click",
                  async () => {
                    const pinnedChats = document.querySelector(
                      "#pinnedChats"
                    ) as HTMLUListElement;
                    if (chatUrl) {
                      const pinnedChat = pinnedChats
                        .querySelector(
                          `a[href="https://chatgpt.com${chatUrl}"]`
                        )
                        ?.closest("li");
                      if (pinnedChat) {
                        pinnedChat.remove();
                      }

                      const profile = await chrome.storage.sync.get([
                        `${profileId}`,
                      ]);
                      const pinnedChatsUrls: string[] =
                        profile[`${profileId}`] || [];
                      const index = pinnedChatsUrls.indexOf(chatUrl);
                      if (index !== -1) {
                        pinnedChatsUrls.splice(index, 1);
                        await chrome.storage.sync.set({
                          [`${profileId}`]: pinnedChatsUrls,
                        });
                      }
                    }
                  }
                );
              }
            });
          }

          // Get the list of pinned chats
          const profile = await chrome.storage.sync.get([`${profileId}`]);
          const pinnedChatsUrls: string[] = profile[`${profileId}`] || [];

          // Check if the button already exists
          if (!menuContent.querySelector(".custom-button")) {
            // Create the pin button
            const pinButton = document.createElement("button");
            pinButton.innerHTML =
              `
             <svg
              xmlns="http://www.w3.org/2000/svg"
              height="20px"
              viewBox="0 -960 960 960"
              width="20px"
              fill=` +
              (isDarkMode ? "#e3e3e3" : "#707070") +
              `
              style="margin-right: 10px;"
              >
              <path
              d="m624-480 96 96v72H516v228l-36 36-36-36v-228H240v-72l96-96v-264h-48v-72h384v72h-48v264Zm-282 96h276l-66-66v-294H408v294l-66 66Zm138 0Z"
              />
              </svg>
              <span>Pin</span>
            `;
            pinButton.className = "custom-button";
            pinButton.style.cssText =
              `
              display: flex;
              width: calc(100% - 18px);
              align-items: center;
              padding: 12px 10px;
              background: transparent;
              color: ` +
              (isDarkMode ? "fff" : "#000") +
              `;
              font-size: 0.9rem;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              margin-top: 10px;
              margin-bottom: 0px;
              margin-inline: auto;
            `;
            pinButton.addEventListener("mouseover", () => {
              pinButton.style.backgroundColor = isDarkMode
                ? "#404040"
                : "#f5f5f5";
            });
            pinButton.addEventListener("mouseout", () => {
              pinButton.style.backgroundColor = "transparent";
            });

            // Pin button click action
            pinButton.addEventListener("click", async () => {
              const profile = await chrome.storage.sync.get([`${profileId}`]);
              const pinnedChatsUrls: string[] = profile[`${profileId}`] || [];

              if (chatUrl) {
                if (!pinnedChatsUrls.includes(chatUrl)) {
                  pinButton.remove();
                  menuContent.prepend(unpinButton);

                  const pinnedChats = document.querySelector(
                    "#pinnedChats"
                  ) as HTMLUListElement;
                  const pinnedChat = createPinnedChatElement(
                    chatTitle || "",
                    chatUrl,
                    profileId
                  );
                  pinnedChats.prepend(pinnedChat);

                  pinnedChatsUrls.push(chatUrl);
                  await chrome.storage.sync.set({
                    [`${profileId}`]: pinnedChatsUrls,
                  });
                }
              }
            });

            const unpinButton = document.createElement("button");
            unpinButton.innerHTML =
              `
              <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" 
              fill=` +
              (isDarkMode ? "#e3e3e3" : "#707070") +
              `
              style="margin-right: 10px;">
                <path d="M672-816v72h-48v307l-72-72v-235H408v91l-90-90-30-31v-42h384ZM480-48l-36-36v-228H240v-72l96-96v-42.46L90-768l51-51 678 679-51 51-222-223h-30v228l-36 36ZM342-384h132l-66-66-66 66Zm137-192Zm-71 126Z"/>
              </svg>
              <span>Unpin</span>
            `;
            unpinButton.className = "custom-button";
            unpinButton.style.cssText =
              `
              display: flex;
              width: calc(100% - 18px);
              align-items: center;
              padding: 12px 10px;
              background: transparent;
              color: ` +
              (isDarkMode ? "fff" : "#707070") +
              `;
              font-size: 0.9rem;
              border: none;
              border-radius: 5px;
              cursor: pointer;
               margin-top: 10px;
               margin-bottom: 0px;
              margin-inline: auto;
            `;
            unpinButton.addEventListener("mouseover", () => {
              unpinButton.style.backgroundColor = isDarkMode
                ? "#404040"
                : "#f5f5f5";
            });

            unpinButton.addEventListener("mouseout", () => {
              unpinButton.style.backgroundColor = "transparent";
            });

            // Unpin button click action
            unpinButton.addEventListener("click", async () => {
              const profile = await chrome.storage.sync.get([`${profileId}`]);
              const pinnedChatsUrls: string[] = profile[`${profileId}`] || [];

              if (chatUrl) {
                if (pinnedChatsUrls.includes(chatUrl)) {
                  unpinButton.remove();
                  menuContent.prepend(pinButton);

                  const pinnedChats = document.querySelector(
                    "#pinnedChats"
                  ) as HTMLUListElement;
                  const pinnedChat = pinnedChats
                    .querySelector(`a[href="https://chatgpt.com${chatUrl}"]`)
                    ?.closest("li");
                  if (pinnedChat) {
                    pinnedChat.remove();
                  }

                  const index = pinnedChatsUrls.indexOf(chatUrl);
                  pinnedChatsUrls.splice(index, 1);
                  await chrome.storage.sync.set({
                    [`${profileId}`]: pinnedChatsUrls,
                  });
                }
              }
            });

            if (chatUrl) {
              if (pinnedChatsUrls.includes(chatUrl)) {
                menuContent.prepend(unpinButton);
              } else {
                menuContent.prepend(pinButton);
              }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error("Error while setting up pinned chats:", error);
  }
})();
