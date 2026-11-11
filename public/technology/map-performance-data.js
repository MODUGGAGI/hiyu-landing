export default {
  "measuredOn": "2026-11-02",
  "sourceSha256": "010897d79ee7b861f88a096bc7fef3333cef4d1af40fa876c729b162f8d10f65",
  "versions": [
    {
      "key": "v1",
      "label": "부모 지역 JOIN"
    },
    {
      "key": "v2",
      "label": "지역 코드 집계"
    },
    {
      "key": "v3",
      "label": "기본 Caffeine"
    },
    {
      "key": "v4",
      "label": "최종 개선"
    }
  ],
  "rates": {
    "100": {
      "v1": {
        "p95": {
          "pins": 59.89,
          "sido": 93.99,
          "sigungu": 101.47
        },
        "droppedPercentMax": 0.13,
        "failures": 0
      },
      "v2": {
        "p95": {
          "pins": 29.53,
          "sido": 26.49,
          "sigungu": 29.62
        },
        "droppedPercentMax": 0.04,
        "failures": 0
      },
      "v3": {
        "p95": {
          "pins": 15.58,
          "sido": 14.17,
          "sigungu": 16.63
        },
        "droppedPercentMax": 0.13,
        "failures": 0
      },
      "v4": {
        "p95": {
          "pins": 11.94,
          "sido": 13.19,
          "sigungu": 15.05
        },
        "droppedPercentMax": 0.04,
        "failures": 0
      }
    },
    "150": {
      "v1": {
        "p95": {
          "pins": 668.33,
          "sido": 717.29,
          "sigungu": 726.52
        },
        "droppedPercentMax": 1.17,
        "failures": 0
      },
      "v2": {
        "p95": {
          "pins": 88.27,
          "sido": 83.63,
          "sigungu": 95.81
        },
        "droppedPercentMax": 0.29,
        "failures": 0
      },
      "v3": {
        "p95": {
          "pins": 27.17,
          "sido": 24.18,
          "sigungu": 26.55
        },
        "droppedPercentMax": 0.26,
        "failures": 0
      },
      "v4": {
        "p95": {
          "pins": 13.95,
          "sido": 15.64,
          "sigungu": 17.1
        },
        "droppedPercentMax": 0.06,
        "failures": 0
      }
    }
  }
};
