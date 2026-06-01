type Cleanup = () => void;

type PriceSize = "small" | "medium" | "cat";

type PriceEntry = {
  label: string;
  bath: number;
  style: number;
  spa: number;
};

const prices: Record<PriceSize, PriceEntry> = {
  small: { label: "当前显示：小型犬 10kg 内", bath: 128, style: 268, spa: 198 },
  medium: { label: "当前显示：中型犬 10-25kg", bath: 198, style: 388, spa: 268 },
  cat: { label: "当前显示：猫咪低压洗护", bath: 188, style: 328, spa: 258 }
};

export function initPageInteractions(): Cleanup {
  const cleanup: Cleanup[] = [];

  const onElement = <K extends keyof HTMLElementEventMap>(
    target: HTMLElement,
    event: K,
    handler: (event: HTMLElementEventMap[K]) => void
  ) => {
    target.addEventListener(event, handler);
    cleanup.push(() => target.removeEventListener(event, handler));
  };

  initMenu(cleanup, onElement);
  initEnvironmentCarousel(cleanup, onElement);
  initPricing(onElement);
  initBookingForm(onElement);

  return () => {
    cleanup.forEach((dispose) => dispose());
    document.body.classList.remove("menu-open");
  };
}

function initMenu(
  cleanup: Cleanup[],
  onElement: <K extends keyof HTMLElementEventMap>(
    target: HTMLElement,
    event: K,
    handler: (event: HTMLElementEventMap[K]) => void
  ) => void
) {
  const menuButton = document.querySelector<HTMLButtonElement>("#menuButton");
  const navLinks = document.querySelector<HTMLElement>("#navLinks");

  if (!menuButton || !navLinks) return;

  const closeMenu = () => {
    navLinks.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "打开导航");
  };

  onElement(menuButton, "click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    document.body.classList.toggle("menu-open", isOpen);
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "关闭导航" : "打开导航");
  });

  navLinks.querySelectorAll<HTMLAnchorElement>("a").forEach((item) => {
    onElement(item, "click", closeMenu);
  });

  cleanup.push(closeMenu);
}

function initEnvironmentCarousel(
  cleanup: Cleanup[],
  onElement: <K extends keyof HTMLElementEventMap>(
    target: HTMLElement,
    event: K,
    handler: (event: HTMLElementEventMap[K]) => void
  ) => void
) {
  const environmentSlides = document.querySelectorAll<HTMLElement>(".environment-slide");
  const environmentOptions = document.querySelectorAll<HTMLButtonElement>(".environment-option");
  const environmentPrev = document.querySelector<HTMLButtonElement>("[data-environment-prev]");
  const environmentNext = document.querySelector<HTMLButtonElement>("[data-environment-next]");

  if (!environmentSlides.length || !environmentOptions.length || !environmentPrev || !environmentNext) return;

  let activeEnvironment = 0;
  let environmentTimer: number | undefined;

  const showEnvironment = (index: number) => {
    activeEnvironment = (index + environmentSlides.length) % environmentSlides.length;
    environmentSlides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === activeEnvironment);
    });
    environmentOptions.forEach((option, optionIndex) => {
      option.setAttribute("aria-selected", String(optionIndex === activeEnvironment));
    });
  };

  const restartEnvironmentTimer = () => {
    window.clearInterval(environmentTimer);
    environmentTimer = window.setInterval(() => showEnvironment(activeEnvironment + 1), 4600);
  };

  environmentOptions.forEach((option) => {
    onElement(option, "click", () => {
      showEnvironment(Number(option.dataset.environmentIndex));
      restartEnvironmentTimer();
    });
  });

  onElement(environmentPrev, "click", () => {
    showEnvironment(activeEnvironment - 1);
    restartEnvironmentTimer();
  });

  onElement(environmentNext, "click", () => {
    showEnvironment(activeEnvironment + 1);
    restartEnvironmentTimer();
  });

  restartEnvironmentTimer();
  cleanup.push(() => window.clearInterval(environmentTimer));
}

function initPricing(
  onElement: <K extends keyof HTMLElementEventMap>(
    target: HTMLElement,
    event: K,
    handler: (event: HTMLElementEventMap[K]) => void
  ) => void
) {
  const priceButtons = document.querySelectorAll<HTMLButtonElement>(".segmented button");
  const priceNote = document.querySelector<HTMLElement>("#priceNote");

  if (!priceButtons.length || !priceNote) return;

  priceButtons.forEach((button) => {
    onElement(button, "click", () => {
      const selected = button.dataset.size as PriceSize | undefined;
      if (!selected || !prices[selected]) return;

      priceButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      priceNote.textContent = prices[selected].label;

      Object.entries(prices[selected]).forEach(([key, value]) => {
        if (key === "label") return;

        const target = document.querySelector<HTMLElement>(`[data-price="${key}"]`);
        if (target) target.textContent = String(value);
      });
    });
  });
}

function initBookingForm(
  onElement: <K extends keyof HTMLElementEventMap>(
    target: HTMLElement,
    event: K,
    handler: (event: HTMLElementEventMap[K]) => void
  ) => void
) {
  const dateInput = document.querySelector<HTMLInputElement>("#date");
  const timeInput = document.querySelector<HTMLSelectElement>("#time");
  const bookingForm = document.querySelector<HTMLFormElement>("#bookingForm");
  const formStatus = document.querySelector<HTMLElement>("#formStatus");

  if (!dateInput || !timeInput || !bookingForm || !formStatus) return;

  const today = new Date();
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  dateInput.min = localDate;

  const updateArrivalPreview = () => {
    const date = dateInput.value;
    const time = timeInput.value;

    if (date && time) {
      formStatus.textContent = `已选择期望到店时间：${date} ${time}`;
      return;
    }

    if (date) {
      formStatus.textContent = "已选择到店日期，请继续选择期望到店时间。";
      return;
    }

    if (time) {
      formStatus.textContent = "已选择到店时段，请继续选择期望到店日期。";
      return;
    }

    formStatus.textContent = "请选择期望到店日期和时间。";
  };

  onElement(dateInput, "change", updateArrivalPreview);
  onElement(timeInput, "change", updateArrivalPreview);
  updateArrivalPreview();

  onElement(bookingForm, "submit", (event) => {
    event.preventDefault();

    const data = new FormData(bookingForm);
    const name = data.get("parentName") || "您";
    const service = data.get("service") || "护理";
    const date = data.get("date") || "预约日期";
    const time = data.get("time") || "预约时段";

    formStatus.textContent = `${name}，${service}的期望到店时间 ${date} ${time} 已记录，门店会尽快与您确认。`;
    bookingForm.reset();
    dateInput.min = localDate;
  });
}
