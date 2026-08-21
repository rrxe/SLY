import { useEffect, useRef, useState } from "react";
import "../styles/tasks.css";

type Props = {
  onRewardCoins: (
    amount: number,
    title: string,
    meta: string
  ) => void;
};

type ServerTask = {
  id: string | number;
  title: string;
  reward: number;
  url: string;
  is_active: boolean;
  task_type?: string;
  max_completions?: number;
};

type TaskProgress = {
  completed: number;
  max_completions: number;
};

type ProgressMap = Record<
  string,
  TaskProgress
>;

type OpenedMap = Record<
  string,
  number
>;

const PROGRESS_KEY =
  "sly.tasks.progress.v3";

const CLAIM_DELAY_MS = 5000;
const SMART_AD_CLAIM_DELAY_MS = 5000;
const ADS_GALAXY_CLAIM_DELAY_MS = 0;
const GIGA_PUB_CLAIM_DELAY_MS = 0;
const ADSGRAM_CLAIM_DELAY_MS = 0;

const GIGAPUB_PROJECT_ID = "7665";

const GIGAPUB_SCRIPT_SRC =
  `https://ad.gigapub.tech/script?id=${GIGAPUB_PROJECT_ID}`;

const ADSGRAM_TASK_BLOCK_ID = "43643";

type AdsgramShowResult = {
  done: boolean;
  description: string;
  state:
    | "load"
    | "render"
    | "playing"
    | "destroy";
  error: boolean;
};

type AdsgramController = {
  show: () =>
    Promise<AdsgramShowResult>;
};

declare global {
  interface Window {
    Adsgram?: {
      init: (opts: {
        blockId: string;
      }) => AdsgramController;
    };

    showGiga?: () =>
      Promise<unknown>;

    showAdsGalaxy?: () =>
      Promise<unknown>;
  }
}

function loadProgress(): ProgressMap {
  if (
    typeof window ===
    "undefined"
  ) {
    return {};
  }

  try {
    const raw =
      window.localStorage.getItem(
        PROGRESS_KEY
      );

    if (!raw) {
      return {};
    }

    const parsed =
      JSON.parse(raw) as Record<
        string,
        Partial<TaskProgress>
      >;

    const out: ProgressMap = {};

    for (
      const [key, value]
      of Object.entries(parsed)
    ) {
      const completed =
        Number(
          value?.completed || 0
        );

      const max =
        Number(
          value?.max_completions ||
            1
        );

      out[key] = {
        completed:
          Number.isFinite(
            completed
          ) &&
          completed >= 0
            ? completed
            : 0,

        max_completions:
          Number.isFinite(max) &&
          max > 0
            ? max
            : 1,
      };
    }

    return out;
  } catch {
    return {};
  }
}

function getInitData() {
  const tg =
    (window as any)
      .Telegram?.WebApp;

  return (
    tg?.initData || ""
  );
}

function normalizeTaskType(
  task: ServerTask
) {
  return String(
    task.task_type || ""
  )
    .toLowerCase()
    .trim();
}

function isSmartAdTask(
  task: ServerTask
) {
  return (
    normalizeTaskType(task) ===
    "smart_ad"
  );
}

function isAdsGalaxyTask(
  task: ServerTask
) {
  return (
    normalizeTaskType(task) ===
    "ads_galaxy"
  );
}

function isGigaPubTask(
  task: ServerTask
) {
  return (
    normalizeTaskType(task) ===
    "giga_pub"
  );
}

function isAdsGramTask(
  task: ServerTask
) {
  return (
    normalizeTaskType(task) ===
    "adsgram"
  );
}

function isAdTask(
  task: ServerTask
) {
  const type =
    normalizeTaskType(task);

  return [
    "smart_ad",
    "ads_galaxy",
    "giga_pub",
    "adsgram",
    "watch_ad",
  ].includes(type);
}

function isChannelTask(
  task: ServerTask
) {
  return (
    normalizeTaskType(task) ===
    "join_channel"
  );
}

function getClaimDelayMs(
  task: ServerTask
) {
  if (isSmartAdTask(task)) {
    return SMART_AD_CLAIM_DELAY_MS;
  }

  if (isGigaPubTask(task)) {
    return GIGA_PUB_CLAIM_DELAY_MS;
  }

  if (isAdsGalaxyTask(task)) {
    return ADS_GALAXY_CLAIM_DELAY_MS;
  }

  if (isAdsGramTask(task)) {
    return ADSGRAM_CLAIM_DELAY_MS;
  }

  return CLAIM_DELAY_MS;
}

function TaskIcon({
  kind,
}: {
  kind:
    | "task"
    | "ad"
    | "channel";
}) {
  if (kind === "ad") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="task-svg"
        aria-hidden="true"
      >
        <rect
          x="4"
          y="5"
          width="16"
          height="14"
          rx="3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />

        <path
          d="M9 9l6 3-6 3V9z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (
    kind ===
    "channel"
  ) {
    return (
      <svg
        viewBox="0 0 24 24"
        className="task-svg"
        aria-hidden="true"
      >
        <path
          d="M5 7.5h14M5 12h14M5 16.5h9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="task-svg"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M8 12h8M8 8h4M8 16h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ActionIcon({
  type,
}: {
  type:
    | "watch"
    | "open";
}) {
  if (type === "watch") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="task-action-icon"
        aria-hidden="true"
      >
        <path
          d="M8 6.5v11l9-5.5-9-5.5z"
          fill="currentColor"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="task-action-icon"
      aria-hidden="true"
    >
      <path
        d="M14 5h5v5M19 5l-8 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M18 13v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CategoryIcon({
  ad,
}: {
  ad?: boolean;
}) {
  return (
    <span
      className={`task-category-title-icon ${
        ad ? "ad" : ""
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className="task-category-title-svg"
        aria-hidden="true"
      >
        {ad ? (
          <path
            d="M9 7.5h8.5A2.5 2.5 0 0 1 20 10v5a2.5 2.5 0 0 1-2.5 2.5H14l-3.5 2v-2H9A2.5 2.5 0 0 1 6.5 15v-5A2.5 2.5 0 0 1 9 7.5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          />
        ) : (
          <path
            d="M5.5 7.5h13M5.5 12h13M5.5 16.5h8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        )}
      </svg>
    </span>
  );
}

function TaskSection({
  title,
  subtitle,
  tasks,
  progressById,
  openedAtById,
  openingIds,
  claimingIds,
  onOpen,
  ad,
}: {
  title: string;
  subtitle: string;
  tasks: ServerTask[];
  progressById: ProgressMap;
  openedAtById: OpenedMap;
  openingIds: Record<
    string,
    boolean
  >;
  claimingIds: Record<
    string,
    boolean
  >;
  onOpen: (
    task: ServerTask
  ) => void;
  ad?: boolean;
}) {
  if (
    tasks.length === 0
  ) {
    return null;
  }

  return (
    <section className="task-category">
      <div className="task-category-head">
        <div className="task-category-title-wrap">
          <div className="task-category-title-row">
            <CategoryIcon
              ad={ad}
            />

            <h2 className="task-category-title">
              {title}
            </h2>
          </div>

          <p className="task-category-subtitle">
            {subtitle}
          </p>
        </div>

        <span className="task-category-count">
          {tasks.length}
        </span>
      </div>

      <div className="task-category-list">
        {tasks.map(
          (task) => {
            const id =
              String(task.id);

            const isAd =
              isAdTask(task);

            const isChannel =
              isChannelTask(
                task
              );

            const claimDelayMs =
              getClaimDelayMs(
                task
              );

            const progress =
              progressById[
                id
              ] || {
                completed: 0,
                max_completions:
                  Math.max(
                    1,
                    Number(
                      task.max_completions ||
                        1
                    )
                  ),
              };

            const openedAt =
              openedAtById[
                id
              ];

            const opened =
              Boolean(openedAt);

            const waitedEnough =
              opened &&
              Date.now() -
                openedAt >=
                claimDelayMs;

            const claimedAll =
              progress.completed >=
              progress.max_completions;

            const opening =
              Boolean(
                openingIds[
                  id
                ]
              );

            const claiming =
              Boolean(
                claimingIds[
                  id
                ]
              );

            let taskTypeLabel =
              task.task_type ||
              "task";

            if (
              isSmartAdTask(
                task
              )
            ) {
              taskTypeLabel =
                "smart ad";
            } else if (
              isAdsGalaxyTask(
                task
              )
            ) {
              taskTypeLabel =
                "ads galaxy";
            } else if (
              isGigaPubTask(
                task
              )
            ) {
              taskTypeLabel =
                "giga pub";
            } else if (
              isAdsGramTask(
                task
              )
            ) {
              taskTypeLabel =
                "adsgram";
            } else if (
              isChannelTask(
                task
              )
            ) {
              taskTypeLabel =
                "join channel";
            }

            const iconKind =
              isAd
                ? "ad"
                : isChannel
                ? "channel"
                : "task";

            let statusText =
              "";

            let statusClass =
              "gray";

            if (
              claimedAll
            ) {
              statusText =
                "Completed";

              statusClass =
                "green";
            } else if (
              !opened
            ) {
              statusText =
                isAd
                  ? "Watch ad to earn"
                  : isChannel
                  ? "Open channel first"
                  : "Open link first";

              statusClass =
                "gray";
            } else if (
              !waitedEnough
            ) {
              statusText =
                `Sending coins in ${Math.max(
                  1,
                  Math.ceil(
                    (
                      claimDelayMs -
                      (
                        Date.now() -
                        openedAt
                      )
                    ) /
                      1000
                  )
                )}s`;

              statusClass =
                "blue";
            } else {
              statusText =
                claiming
                  ? "Verifying..."
                  : `Ready ${progress.completed}/${progress.max_completions}`;

              statusClass =
                "green";
            }

            return (
              <article
                key={id}
                className={`task-row ${
                  claimedAll
                    ? "done"
                    : ""
                }`}
              >
                <div
                  className={`task-icon ${
                    iconKind ===
                    "ad"
                      ? "ad"
                      : iconKind ===
                        "channel"
                      ? "channel"
                      : "task"
                  }`}
                >
                  <TaskIcon
                    kind={
                      iconKind
                    }
                  />
                </div>

                <div className="task-main">
                  <div className="task-topline">
                    <div className="task-title-wrap">
                      <p className="task-type">
                        {
                          taskTypeLabel
                        }
                      </p>

                      <h2>
                        {
                          task.title
                        }
                      </h2>
                    </div>

                    <strong className="task-reward">
                      +{Number(
                        task.reward ||
                          0
                      )}
                    </strong>
                  </div>

                  <div className="task-mini-status">
                    <span
                      className={
                        statusClass
                      }
                    >
                      {
                        statusText
                      }
                    </span>
                  </div>
                </div>

                <div className="task-actions">
                  <div className="task-progress">
                    <strong>
                      {
                        progress.completed
                      }
                    </strong>

                    <span>
                      /
                      {
                        progress.max_completions
                      }
                    </span>
                  </div>

                  <button
                    type="button"
                    className={`task-btn ${
                      isAd
                        ? "watch"
                        : "join"
                    }`}
                    onClick={() =>
                      onOpen(task)
                    }
                    disabled={
                      opening ||
                      claimedAll
                    }
                  >
                    {opening ? (
                      "Loading..."
                    ) : (
                      <>
                        <ActionIcon
                          type={
                            isAd
                              ? "watch"
                              : "open"
                          }
                        />

                        {isAd
                          ? "Watch"
                          : "Open"}
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          }
        )}
      </div>
    </section>
  );
}

export default function Tasks({
  onRewardCoins,
}: Props) {
  const [
    toast,
    setToast,
  ] = useState("");

  const [
    serverTasks,
    setServerTasks,
  ] = useState<
    ServerTask[]
  >([]);

  const [
    loadingTasks,
    setLoadingTasks,
  ] = useState(true);

  const [
    progressById,
    setProgressById,
  ] = useState<ProgressMap>(
    () => loadProgress()
  );

  const [
    openedAtById,
    setOpenedAtById,
  ] = useState<OpenedMap>(
    {}
  );

  const [
    openingIds,
    setOpeningIds,
  ] = useState<
    Record<
      string,
      boolean
    >
  >({});

  const [
    claimingIds,
    setClaimingIds,
  ] = useState<
    Record<
      string,
      boolean
    >
  >({});

  const [
    gigapubReady,
    setGigapubReady,
  ] = useState(false);

  const claimTimersRef =
    useRef<
      Record<
        string,
        number
      >
    >({});

  const adsgramControllerRef =
    useRef<
      AdsgramController | null
    >(null);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, []);

  useEffect(() => {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    if (window.showGiga) {
      setGigapubReady(true);
      return;
    }

    const script =
      document.createElement(
        "script"
      );

    script.src =
      GIGAPUB_SCRIPT_SRC;

    script.async = true;

    script.onload = () =>
      setGigapubReady(true);

    script.onerror = () => {
      setGigapubReady(false);

      console.log(
        "Failed to load GigaPub SDK"
      );
    };

    document.body.appendChild(
      script
    );

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        PROGRESS_KEY,
        JSON.stringify(
          progressById
        )
      );
    } catch {}
  }, [progressById]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer =
      window.setTimeout(
        () =>
          setToast(""),
        1800
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [toast]);

  useEffect(() => {
    fetch(
      "/api/tasks/list"
    )
      .then((res) =>
        res.json()
      )
      .then((data) => {
        if (
          data?.success &&
          Array.isArray(
            data.tasks
          )
        ) {
          setServerTasks(
            data.tasks
          );
        } else {
          setServerTasks(
            []
          );
        }
      })
      .catch(() =>
        setServerTasks(
          []
        )
      )
      .finally(() =>
        setLoadingTasks(
          false
        )
      );
  }, []);

  const postTaskAction =
    async (
      body: Record<
        string,
        unknown
      >
    ) => {
      const initData =
        getInitData();

      const res =
        await fetch(
          "/api/tasks/complete",
          {
            method:
              "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `tga ${initData}`,
            },
            body:
              JSON.stringify(
                body
              ),
          }
        );

      const data =
        await res.json();

      if (
        !res.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Failed to process task"
        );
      }

      return data;
    };

  const clearClaimTimer =
    (
      id: string
    ) => {
      const handle =
        claimTimersRef.current[
          id
        ];

      if (handle) {
        window.clearTimeout(
          handle
        );

        delete claimTimersRef.current[
          id
        ];
      }
    };

  const handleClaimServerTask =
    async (
      task: ServerTask
    ) => {
      const id =
        String(task.id);

      if (
        claimingIds[id]
      ) {
        return;
      }

      const openedAt =
        openedAtById[id];

      const claimDelayMs =
        getClaimDelayMs(
          task
        );

      if (!openedAt) {
        return;
      }

      if (
        Date.now() -
          openedAt <
        claimDelayMs
      ) {
        return;
      }

      const current =
        progressById[id] || {
          completed: 0,
          max_completions:
            Math.max(
              1,
              Number(
                task.max_completions ||
                  1
              )
            ),
        };

      if (
        current.completed >=
        current.max_completions
      ) {
        return;
      }

      setClaimingIds(
        (prev) => ({
          ...prev,
          [id]: true,
        })
      );
try {
        const data =
          await postTaskAction({
            taskId:
              task.id,
          });

        const nextCompleted =
          Number(
            data.progress
              ?.completed ??
              current.completed +
                1
          );

        const nextMax =
          Number(
            data.progress
              ?.max_completions ??
              current.max_completions
          );

        const reward =
          Number(
            data.reward ??
              task.reward ??
              0
          );

        setProgressById(
          (prev) => ({
            ...prev,
            [id]: {
              completed:
                nextCompleted,
              max_completions:
                nextMax,
            },
          })
        );

        setOpenedAtById(
          (prev) => {
            const copy =
              {
                ...prev,
              };

            delete copy[
              id
            ];

            return copy;
          }
        );

        onRewardCoins(
          reward,
          task.title,
          `Task ${nextCompleted}/${nextMax} +${reward} coins`
        );

        setToast(
          `+${reward} coins`
        );
      } catch (
        err: any
      ) {
        setToast(
          err?.message ||
            "Failed to verify task"
        );
      } finally {
        clearClaimTimer(
          id
        );

        setClaimingIds(
          (prev) => {
            const copy =
              {
                ...prev,
              };

            delete copy[
              id
            ];

            return copy;
          }
        );
      }
    };

  const scheduleAutoClaim =
    (
      task: ServerTask,
      openedAt: number
    ) => {
      const id =
        String(task.id);

      clearClaimTimer(
        id
      );

      const delayMs =
        getClaimDelayMs(
          task
        );

      const remaining =
        Math.max(
          0,
          delayMs -
            (
              Date.now() -
              openedAt
            )
        );

      claimTimersRef.current[
        id
      ] =
        window.setTimeout(
          () => {
            delete claimTimersRef.current[
              id
            ];

            handleClaimServerTask(
              task
            );
          },
          remaining
        );
    };

  useEffect(() => {
    Object.entries(
      openedAtById
    ).forEach(
      ([
        id,
        openedAt,
      ]) => {
        if (
          claimTimersRef.current[
            id
          ]
        ) {
          return;
        }

        const task =
          serverTasks.find(
            (t) =>
              String(t.id) ===
              id
          );

        if (!task) {
          return;
        }

        const progress =
          progressById[
            id
          ] || {
            completed: 0,
            max_completions:
              Math.max(
                1,
                Number(
                  task.max_completions ||
                    1
                )
              ),
          };

        if (
          progress.completed >=
          progress.max_completions
        ) {
          return;
        }

        scheduleAutoClaim(
          task,
          openedAt
        );
      }
    );
  }, [
    serverTasks,
    openedAtById,
    progressById,
  ]);

  useEffect(() => {
    return () => {
      Object.values(
        claimTimersRef.current
      ).forEach(
        (handle) =>
          window.clearTimeout(
            handle
          )
      );

      claimTimersRef.current =
        {};
    };
  }, []);

  const handleOpenTask =
    async (
      task: ServerTask
    ) => {
      const id =
        String(task.id);

      if (
        openingIds[id]
      ) {
        return;
      }

      const progress =
        progressById[
          id
        ] || {
          completed: 0,
          max_completions:
            Math.max(
              1,
              Number(
                task.max_completions ||
                  1
              )
            ),
        };

      if (
        progress.completed >=
        progress.max_completions
      ) {
        setToast(
          "Task limit reached."
        );

        return;
      }

      const taskType =
        normalizeTaskType(
          task
        );

      const allowedTypes =
        [
          "normal",
          "smart_ad",
          "ads_galaxy",
          "join_channel",
          "custom",
          "giga_pub",
          "adsgram",
          "watch_ad",
        ];

      if (
        !allowedTypes.includes(
          taskType
        )
      ) {
        setToast(
          "Invalid task type."
        );

        return;
      }

      setOpeningIds(
        (prev) => ({
          ...prev,
          [id]: true,
        })
      );

      try {
        if (
          isAdsGalaxyTask(
            task
          )
        ) {
          const showAd =
            (
              window as any
            ).showAdsGalaxy;

          if (
            typeof showAd !==
            "function"
          ) {
            setToast(
              "Ad not ready yet. Try again in a moment."
            );

            return;
          }

          try {
            await showAd();
          } catch (
            adErr: any
          ) {
            const code =
              adErr?.code ||
              "";

            if (
              code ===
              "NO_FILL"
            ) {
              setToast(
                "No ad available right now."
              );
            } else if (
              code ===
              "INVALID_INIT_DATA"
            ) {
              setToast(
                "Open this from inside Telegram."
              );
            } else {
              setToast(
                adErr?.message ||
                  "Ad failed to load."
              );
            }

            return;
          }

          await postTaskAction({
            taskId:
              task.id,
            action:
              "open",
          });

          const openedAt =
            Date.now();

          setOpenedAtById(
            (prev) => ({
              ...prev,
              [id]:
                openedAt,
            })
          );

          scheduleAutoClaim(
            task,
            openedAt
          );

          setToast(
            "Ad watched. Claiming coins..."
          );

          return;
        }

        if (
          isGigaPubTask(
            task
          )
        ) {
          if (
            !gigapubReady
          ) {
            setToast(
              "GigaPub ad not ready yet. Try again."
            );

            return;
          }

          const showGiga =
            (
              window as any
            ).showGiga;

          if (
            typeof showGiga !==
            "function"
          ) {
            setToast(
              "GigaPub SDK not loaded."
            );

            return;
          }

          try {
            await showGiga();
          } catch (
            err: any
          ) {
            setToast(
              err?.message ||
                "Ad failed to load."
            );

            return;
          }

          await postTaskAction({
            taskId:
              task.id,
            action:
              "open",
          });

          const openedAt =
            Date.now();

          setOpenedAtById(
            (prev) => ({
              ...prev,
              [id]:
                openedAt,
            })
          );

          scheduleAutoClaim(
            task,
            openedAt
          );

          setToast(
            "Ad watched. Claiming coins..."
          );

          return;
        }

        if (
          isAdsGramTask(
            task
          )
        ) {
          if (
            !adsgramControllerRef.current &&
            window.Adsgram
          ) {
            adsgramControllerRef.current =
              window.Adsgram.init({
                blockId:
                  ADSGRAM_TASK_BLOCK_ID,
              });
          }

          if (
            !adsgramControllerRef.current
          ) {
            setToast(
              "AdsGram ad not ready yet. Try again."
            );

            return;
          }

          try {
            await adsgramControllerRef.current.show();
          } catch (
            err: any
          ) {
            setToast(
              err?.message ||
                "Ad failed to load."
            );

            return;
          }

          await postTaskAction({
            taskId:
              task.id,
            action:
              "open",
          });

          const openedAt =
            Date.now();

          setOpenedAtById(
            (prev) => ({
              ...prev,
              [id]:
                openedAt,
            })
          );

          scheduleAutoClaim(
            task,
            openedAt
          );

          setToast(
            "Ad watched. Claiming coins..."
          );

          return;
        }

        const url =
          String(
            task.url || ""
          ).trim();

        if (!url) {
          setToast(
            "Task has no URL."
          );

          return;
        }

        await postTaskAction({
          taskId:
            task.id,
          action:
            "open",
        });

        window.open(
          url,
          "_blank",
          "noopener,noreferrer"
        );

        const openedAt =
          Date.now();

        setOpenedAtById(
          (prev) => ({
            ...prev,
            [id]:
              openedAt,
          })
        );

        scheduleAutoClaim(
          task,
          openedAt
        );

        const waitSeconds =
          getClaimDelayMs(
            task
          ) / 1000;

        setToast(
          `Opened. Sending coins in ${waitSeconds} seconds.`
        );
      } catch (
        err: any
      ) {
        setToast(
          err?.message ||
            "Failed to open task."
        );
      } finally {
        setOpeningIds(
          (prev) => {
            const copy =
              {
                ...prev,
              };

            delete copy[
              id
            ];

            return copy;
          }
        );
      }
    };

  const adTasks =
    serverTasks.filter(
      (task) =>
        isAdTask(task)
    );

  const channelTasks =
    serverTasks.filter(
      (task) =>
        isChannelTask(
          task
        )
    );

  const otherTasks =
    serverTasks.filter(
      (task) =>
        !isAdTask(task) &&
        !isChannelTask(
          task
        )
    );

  return (
    <section className="tasks-page">
      {toast ? (
        <div className="tasks-toast">
          {toast}
        </div>
      ) : null}

      <section className="tasks-hero">
        <div className="tasks-hero-icon">
          <CoinsIcon />
        </div>

        <div className="tasks-hero-text">
          <h1>
            Earn Coins
          </h1>

          <p>
            Complete simple tasks and earn coins
          </p>
        </div>
      </section>

      {loadingTasks ? (
        <div className="task-empty">
          Loading tasks...
        </div>
      ) : serverTasks.length === 0 ? (
        <div className="task-empty">
          No tasks available right now.
        </div>
      ) : (
        <>
          {/* الإعلانات أولاً */}
          <TaskSection
            title="Ad Tasks"
            subtitle="Watch ads and earn coins"
            tasks={
              adTasks
            }
            progressById={
              progressById
            }
            openedAtById={
              openedAtById
            }
            openingIds={
              openingIds
            }
            claimingIds={
              claimingIds
            }
            onOpen={
              handleOpenTask
            }
            ad
          />

          {/* القنوات ثانيًا */}
          <TaskSection
            title="Channel Tasks"
            subtitle="Join channels and earn coins"
            tasks={
              channelTasks
            }
            progressById={
              progressById
            }
            openedAtById={
              openedAtById
            }
            openingIds={
              openingIds
            }
            claimingIds={
              claimingIds
            }
            onOpen={
              handleOpenTask
            }
          />

          {/* باقي المهام */}
          <TaskSection
            title="Tasks"
            subtitle="More ways to earn"
            tasks={
              otherTasks
            }
            progressById={
              progressById
            }
            openedAtById={
              openedAtById
            }
            openingIds={
              openingIds
            }
            claimingIds={
              claimingIds
            }
            onOpen={
              handleOpenTask
            }
          />
        </>
      )}
    </section>
  );
}
