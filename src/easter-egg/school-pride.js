const lifeEmitter = {
    count: 5,
    duration: 1,
    delay: 0
}
export const options = {
    "fullScreen": {
      "zIndex": 1
    },
    // "background": {
    //     color: "#000",
    //     opacity: 0.8
    // },
    "emitters": [
      {
        "position": {
          "x": 0,
          "y": 30
            },
        "life": lifeEmitter,
        "rate": {
          "quantity": 10
        //   "delay": 0.15
        },
        "particles": {
          "move": {
            "direction": "top-right",
            "outModes": {
              "top": "none",
              "left": "none",
              "default": "destroy"
            }
          }
        }
      },
        {
        "life": lifeEmitter,
        "position": {
          "x": 100,
          "y": 30
        },
        "rate": {
          "quantity": 10
        //   "delay": 0.15
        },
        "particles": {
          "move": {
            "direction": "top-left",
            "outModes": {
              "top": "none",
              "right": "none",
              "default": "destroy"
            }
          }
        }
      }
    ],
    "particles": {
      "color": {
        "value": [
            "#ffffff",
            "#FF0000",
            "#00FFFC",
            "#FC00FF",
            "#fffc00"
        ]
      },
      "move": {
        "decay": 0.01,
        "direction": "top",
        "enable": true,
        "gravity": {
          "enable": true
        },
        "outModes": {
          "top": "none",
          "default": "destroy"
        },
      "speed": {
            "min": "10",
            "max": "50"
        }
      },
      "number": {
        "value": 0
      },
      "opacity": {
        "value": 1
      },
      "rotate": {
        "value": {
          "min": 0,
          "max": 360
        },
        "direction": "random",
        "animation": {
          "enable": true,
          "speed": 30
        }
      },
      "tilt": {
        "direction": "random",
        "enable": true,
        "value": {
          "min": 0,
          "max": 360
        },
        "animation": {
          "enable": true,
          "speed": 30
        }
      },
      "size": {
        "value": {
          "min": 0,
          "max": 2
        },
        "animation": {
          "enable": true,
          "startValue": "min",
          "count": 1,
          "speed": 16,
          "sync": true
        }
      },
      "roll": {
        "darken": {
          "enable": true,
          "value": 25
        },
        "enable": true,
        "speed": {
          "min": 5,
          "max": 15
        }
      },
      "wobble": {
        "distance": 30,
        "enable": true,
        "speed": {
          "min": -7,
          "max": 7
        }
      },
      "shape": {
        "type": [
          "circle",
          "square",
          "triangle",
          "emoji",
          "image"
        ],
        "options": {
          "emoji": {
            "particles": {
              "size": {
                "value": 14
              }
            },
            "value": [
              "✨",
              "🤡",
              "🍀",
              "🍙",
              "🦄",
              "⭐️"
            ]
          },
          "image": [
            {
              "src": "https://particles.js.org/images/fruits/apple.png",
              "width": 32,
              "height": 32,
              "particles": {
                "size": {
                  "value": 30
                }
              }
            },
            {
              "src": "https://particles.js.org/images/fruits/avocado.png",
              "width": 32,
              "height": 32,
              "particles": {
                "size": {
                  "value": 30
                }
              }
            },
            {
              "src": "https://particles.js.org/images/fruits/banana.png",
              "width": 32,
              "height": 32,
              "particles": {
                "size": {
                  "value": 30
                }
              }
            },
            {
              "src": "https://particles.js.org/images/fruits/berries.png",
              "width": 32,
              "height": 32,
              "particles": {
                "size": {
                  "value": 30
                }
              }
            },
            {
              "src": "https://particles.js.org/images/fruits/cherry.png",
              "width": 32,
              "height": 32,
              "particles": {
                "size": {
                  "value": 30
                }
              }
            },
            {
              "src": "https://particles.js.org/images/fruits/grapes.png",
              "width": 32,
              "height": 32,
              "particles": {
                "size": {
                  "value": 30
                }
              }
            },
            {
              "src": "https://particles.js.org/images/fruits/lemon.png",
              "width": 32,
              "height": 32,
              "particles": {
                "size": {
                  "value": 30
                }
              }
            },
            {
              "src": "https://particles.js.org/images/fruits/orange.png",
              "width": 32,
              "height": 32,
              "particles": {
                "size": {
                  "value": 30
                }
              }
            },
            {
              "src": "https://particles.js.org/images/fruits/peach.png",
              "width": 32,
              "height": 32,
              "particles": {
                "size": {
                  "value": 30
                }
              }
            },
            {
              "src": "https://particles.js.org/images/fruits/pear.png",
              "width": 32,
              "height": 32,
              "particles": {
                "size": {
                  "value": 30
                }
              }
            },
            {
              "src": "https://particles.js.org/images/fruits/pepper.png",
              "width": 32,
              "height": 32,
              "particles": {
                "size": {
                  "value": 30
                }
              }
            },
            {
              "src": "https://particles.js.org/images/fruits/plum.png",
              "width": 32,
              "height": 32,
              "particles": {
                "size": {
                  "value": 30
                }
              }
            },
            {
              "src": "https://particles.js.org/images/fruits/star.png",
              "width": 32,
              "height": 32,
              "particles": {
                "size": {
                  "value": 30
                }
              }
            },
            {
              "src": "https://particles.js.org/images/fruits/strawberry.png",
              "width": 32,
              "height": 32,
              "particles": {
                "size": {
                  "value": 30
                }
              }
            },
            {
              "src": "https://particles.js.org/images/fruits/watermelon.png",
              "width": 32,
              "height": 32,
              "particles": {
                "size": {
                  "value": 30
                }
              }
            },
            {
              "src": "https://particles.js.org/images/fruits/watermelon_slice.png",
              "width": 32,
              "height": 32,
              "particles": {
                "size": {
                  "value": 30
                }
              }
            }
          ]
        }
      }
    }
}