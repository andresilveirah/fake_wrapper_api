const { Router } = require('express')

const { gdpr: { tcfv2 }, ccpa } = require('./helpers/spClient')
const geolookup = require('./helpers/geolookup')

const router = Router()

const gdprConsent = async (body, location) => {
  const gdprReq = {...body, ...body.gdpr}
  console.log({gdprReq})
  return location === "GDPR" ? tcfv2.consent(gdprReq) : tcfv2.getMessage(gdprReq);
}

const ccpaConsent = async (body, location) => {
  const ccpaReq = {...body, ...body.ccpa}
  console.log({ccpaReq})
  return location === "CCPA" ? ccpa.consent(ccpaReq) : ccpa.getMessage(ccpaReq);
}

router.post('/native-message', async (req, res) => {
  const ip = req.query.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const location = await geolookup(ip)
  const targetingParams = JSON.stringify({ location })
  const body = {...req.body, targetingParams, alwaysDisplayDNS: false }
  
  const gdprReq = {...body, ...body.gdpr}
  const ccpaReq = {...body, ...body.ccpa}
  
  console.log({ ip,location })
  console.log({ gdprReq })
  console.log({ ccpaReq })
  
  let [gdprResult, ccpaResult] = await Promise.all([
    tcfv2.nativeMessage(gdprReq),
    ccpa.getMessage(ccpaReq)
  ]);
  
  const appliedLegislation = location === "GDPR" ? gdprResult : ccpaResult
  
  res.status(200).json({
    message: {
      legislation: location,
      msgJSON: appliedLegislation.msgJSON,
      choiceOptions: appliedLegislation.choiceOptions,
      stackInfo: appliedLegislation.stackInfo
    },
    gdpr: gdprResult,
    ccpa: { 
      applies: location === "CCPA",
      uuid: ccpaResult.uuid,
      userConsent: ccpaResult.userConsent,
      meta: ccpaResult.meta
    }
  })
})

router.post('/consent', async (req, res) => {
  const ip = req.query.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const location = await geolookup(ip)
  const { body } = req;
  
  console.log({ip, location})
  console.log({body});
  
  let [gdprResult, ccpaResult] = await Promise.all([
    gdprConsent(body, location),
    ccpaConsent(body, location)
  ])
  
  if (gdprResult.err || ccpaResult.err) {
    res.status(500).json({ err: { gdpr: gdprResult.err, ccpa: ccpaResult.err }})
    return
  }
  
  res.status(200).json({
    gdpr: { ...gdprResult, gdprApplies: location === "GDPR" },
    ccpa: { ...ccpaResult, ccpaApplies: location === "CCPA" }
  })
})

const renderingAppMessageCCPA = {
  "message_json": {
    "type": "Notice",
    "name": "CCPA Message",
    "settings": {
      "showClose": false
    },
    "children": [
      {
        "type": "Row",
        "name": "Row",
        "settings": {},
        "children": [
          {
            "type": "Text",
            "name": "Title",
            "settings": {
              "languages": {
                "EN": {
                  "text": "<p>CCPA Message</p>"
                }
              },
              "text": "<p>CCPA Message</p>",
              "font": {
                "fontSize": 35,
                "fontWeight": "400",
                "color": "#000000",
                "fontFamily": "arial, helvetica, sans-serif"
              },
              "align": "left",
              "padding": {
                "paddingLeft": 0,
                "paddingRight": 0,
                "paddingTop": 0,
                "paddingBottom": 0
              },
              "margin": {
                "marginLeft": 0,
                "marginRight": 0,
                "marginTop": 0,
                "marginBottom": 0
              }
            },
            "children": []
          }
        ]
      },
      {
        "type": "Row",
        "name": "Row",
        "settings": {},
        "children": [
          {
            "type": "Text",
            "name": "Description",
            "settings": {
              "languages": {
                "EN": {
                  "text": "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>"
                }
              },
              "text": "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>",
              "margin": {
                "marginLeft": 0,
                "marginRight": 0,
                "marginTop": 10,
                "marginBottom": 10
              },
              "padding": {
                "paddingLeft": 0,
                "paddingRight": 0,
                "paddingTop": 10,
                "paddingBottom": 10
              },
              "font": {
                "fontSize": 18,
                "fontWeight": "400",
                "color": "#000000",
                "fontFamily": "arial, helvetica, sans-serif"
              }
            },
            "children": []
          }
        ]
      },
      {
        "type": "Row",
        "name": "Row",
        "settings": {},
        "children": [
          {
            "type": "Column",
            "name": "Column",
            "settings": {
              "align": "center",
              "padding": {
                "paddingLeft": 10,
                "paddingRight": 10,
                "paddingTop": 0,
                "paddingBottom": 0
              },
              "margin": {
                "marginLeft": 10,
                "marginRight": 10,
                "marginTop": 0,
                "marginBottom": 0
              }
            },
            "children": [
              {
                "type": "Button",
                "name": "Show PM Button",
                "settings": {
                  "languages": {
                    "EN": {
                      "text": "Options"
                    }
                  },
                  "text": "Options",
                  "choice_option": {
                    "type": 12,
                    "data": {
                      "button_text": "1612862129297",
                      "privacy_manager_iframe_url": "https://ccpa-pm.sp-prod.net?privacy_manager_id=5f22957607d3576fbb14cf8c",
                      "consent_origin": "https://ccpa-service.sp-prod.net"
                    }
                  },
                  "font": {
                    "fontSize": 16,
                    "fontWeight": "400",
                    "color": "#1890ff",
                    "fontFamily": "arial, helvetica, sans-serif"
                  },
                  "width": {
                    "type": "%",
                    "value": 100
                  },
                  "background": "#fff"
                },
                "children": []
              }
            ]
          },
          {
            "type": "Column",
            "name": "Column",
            "settings": {
              "align": "center",
              "margin": {
                "marginLeft": 10,
                "marginRight": 10,
                "marginTop": 0,
                "marginBottom": 0
              },
              "padding": {
                "paddingLeft": 10,
                "paddingRight": 10,
                "paddingTop": 0,
                "paddingBottom": 0
              }
            },
            "children": [
              {
                "type": "Button",
                "name": "Reject All Button",
                "settings": {
                  "languages": {
                    "EN": {
                      "text": "Reject All"
                    }
                  },
                  "text": "Reject All",
                  "choice_option": {
                    "type": 13,
                    "data": {
                      "button_text": "1596097595162",
                      "consent_origin": "https://ccpa-service.sp-prod.net",
                      "consent_language": "EN"
                    }
                  },
                  "font": {
                    "fontSize": 16,
                    "fontWeight": "400",
                    "color": "#ffffff",
                    "fontFamily": "arial, helvetica, sans-serif"
                  },
                  "width": {
                    "type": "%",
                    "value": 100
                  },
                  "background": "#ec6565"
                },
                "children": []
              }
            ]
          },
          {
            "type": "Column",
            "name": "Column",
            "settings": {
              "align": "center",
              "padding": {
                "paddingLeft": 10,
                "paddingRight": 10,
                "paddingTop": 0,
                "paddingBottom": 0
              },
              "margin": {
                "marginLeft": 10,
                "marginRight": 10,
                "marginTop": 0,
                "marginBottom": 0
              }
            },
            "children": [
              {
                "type": "Button",
                "name": "Accept All Button",
                "settings": {
                  "languages": {
                    "EN": {
                      "text": "Accept All"
                    }
                  },
                  "text": "Accept All",
                  "choice_option": {
                    "type": 11,
                    "data": {
                      "button_text": "1596097547308",
                      "consent_origin": "https://ccpa-service.sp-prod.net",
                      "consent_language": "EN"
                    }
                  },
                  "font": {
                    "fontSize": 16,
                    "fontWeight": "400",
                    "color": "#ffffff",
                    "fontFamily": "arial, helvetica, sans-serif"
                  },
                  "width": {
                    "type": "%",
                    "value": 100
                  },
                  "margin": {
                    "marginLeft": 10,
                    "marginRight": 10,
                    "marginTop": 10,
                    "marginBottom": 10
                  },
                  "padding": {
                    "paddingLeft": 15,
                    "paddingRight": 15,
                    "paddingTop": 10,
                    "paddingBottom": 10
                  }
                },
                "children": []
              }
            ]
          }
        ]
      }
    ],
    "compliance_status": false,
    "compliance_list": []
  },
  "message_choice": [
    {
      "choice_id": 3306997,
      "type": 15,
      "iframe_url": null,
      "button_text": "Dismiss"
    },
    {
      "choice_id": 3306998,
      "type": 12,
      "iframe_url": "https://ccpa-pm.sp-prod.net?privacy_manager_id=5f22957607d3576fbb14cf8c",
      "button_text": "1612862129297"
    },
    {
      "choice_id": 3306999,
      "type": 13,
      "iframe_url": null,
      "button_text": "1596097595162"
    },
    {
      "choice_id": 3307000,
      "type": 11,
      "iframe_url": null,
      "button_text": "1596097547308"
    }
  ],
  "site_id": 10589
}

const renderingAppMessageGDPR = {
  "message_json": {
    "type": "Notice",
    "name": "GDPR Notice",
    "settings": {
      "showClose": false,
      "border": {
        "borderWidth": 0,
        "borderColor": "#000000",
        "borderTopLeftRadius": 0,
        "borderTopRightRadius": 0,
        "borderBottomLeftRadius": 0,
        "borderBottomRightRadius": 0,
        "borderStyle": "solid"
      },
      "padding": {
        "paddingLeft": 0,
        "paddingRight": 0,
        "paddingTop": 0,
        "paddingBottom": 0
      },
      "selected_privacy_manager": {
        "type": 12,
        "data": {
          "button_text": "1612861627042",
          "privacy_manager_iframe_url": "https://notice.sp-prod.net/privacy-manager/index.html?message_id=404472",
          "consent_origin": "https://sourcepoint.mgr.consensu.org/tcfv2"
        }
      }
    },
    "children": [
      {
        "type": "Row",
        "name": "Row",
        "settings": {
          "align": "space-between",
          "vertical": "center",
          "width": {
            "type": "%",
            "value": 100
          },
          "padding": {
            "paddingLeft": 10,
            "paddingRight": 10,
            "paddingTop": 5,
            "paddingBottom": 0
          },
          "margin": {
            "marginLeft": 0,
            "marginRight": 0,
            "marginTop": 0,
            "marginBottom": 0
          },
          "background": "$$primary_color$$"
        },
        "children": [
          {
            "type": "Text",
            "name": "Text",
            "settings": {
              "languages": {
                "EN": {
                  "text": "<p>GDPR Privacy Notice</p>"
                }
              },
              "text": "<p>GDPR Privacy Notice</p>",
              "font": {
                "fontSize": 32,
                "fontWeight": "700",
                "color": "#444444",
                "fontFamily": "arial, helvetica, sans-serif"
              },
              "padding": {
                "paddingLeft": 0,
                "paddingRight": 0,
                "paddingTop": 0,
                "paddingBottom": 0
              },
              "margin": {
                "marginLeft": 0,
                "marginRight": 0,
                "marginTop": 0,
                "marginBottom": 0
              }
            },
            "children": []
          }
        ],
        "handle": "header-row"
      },
      {
        "type": "Row",
        "name": "Row",
        "settings": {
          "width": {
            "type": "%",
            "value": 100
          },
          "padding": {
            "paddingLeft": 0,
            "paddingRight": 0,
            "paddingTop": 0,
            "paddingBottom": 0
          },
          "margin": {
            "marginLeft": 0,
            "marginRight": 0,
            "marginTop": 0,
            "marginBottom": 0
          }
        },
        "children": [
          {
            "type": "Text",
            "name": "Text",
            "settings": {
              "padding": {
                "paddingLeft": 10,
                "paddingRight": 10,
                "paddingTop": 8,
                "paddingBottom": 8
              },
              "margin": {
                "marginLeft": 0,
                "marginRight": 0,
                "marginTop": 0,
                "marginBottom": 0
              },
              "languages": {
                "EN": {
                  "text": "<p>We and our technology partners ask you to consent to the use of cookies to store and access personal data on your device. This can include the use of unique identifiers and information about your browsing patterns to create the best possible user experience on this website. The following description outlines how your data may be used by us, or by our partners.</p><p>&nbsp;</p><p>Some of our <a href=\"https://google.com\" target=\"_blank\" aria-label=\"message-link\">partners</a> process personal data on the basis of legitimate interest. You can object to such processing at any time. Please click “Options” below to view our list of partners and the purposes for which consent is required.</p><p>&nbsp;</p><p>You don’t have to consent in order to view the information on this site, but if you don’t consent, some personalization of content and advertising won’t be available. Your choices on this site will be applied only to this site. You can change your settings at any time by using the link at the bottom of the page to reopen the Privacy Preferences and managing the setting.</p>"
                }
              },
              "text": "<p>We and our technology partners ask you to consent to the use of cookies to store and access personal data on your device. This can include the use of unique identifiers and information about your browsing patterns to create the best possible user experience on this website. The following description outlines how your data may be used by us, or by our partners.</p><p>&nbsp;</p><p>Some of our <a href=\"https://google.com\" target=\"_blank\" aria-label=\"message-link\">partners</a> process personal data on the basis of legitimate interest. You can object to such processing at any time. Please click “Options” below to view our list of partners and the purposes for which consent is required.</p><p>&nbsp;</p><p>You don’t have to consent in order to view the information on this site, but if you don’t consent, some personalization of content and advertising won’t be available. Your choices on this site will be applied only to this site. You can change your settings at any time by using the link at the bottom of the page to reopen the Privacy Preferences and managing the setting.</p>",
              "choice_options": [],
              "link": {
                "fontWeight": "400",
                "color": "$$primary_color$$",
                "textDecoration": "underline"
              },
              "hover": {
                "fontWeight": "400",
                "color": "$$primary_color$$",
                "textDecoration": "underline"
              }
            },
            "children": []
          }
        ]
      },
      {
        "type": "Stacks",
        "name": "Stacks",
        "settings": {
          "accordionsSpacing": {
            "paddingLeft": 20,
            "paddingRight": 50,
            "paddingTop": 12,
            "paddingBottom": 12
          },
          "panelSpacing": {
            "paddingLeft": 20,
            "paddingRight": 20,
            "paddingTop": 0,
            "paddingBottom": 12
          }
        },
        "children": []
      },
      {
        "type": "Row",
        "name": "Row",
        "settings": {
          "width": {
            "type": "%",
            "value": 100
          },
          "align": "flex-end",
          "padding": {
            "paddingLeft": 0,
            "paddingRight": 10,
            "paddingTop": 0,
            "paddingBottom": 0
          },
          "margin": {
            "marginLeft": 0,
            "marginRight": 0,
            "marginTop": 0,
            "marginBottom": 0
          }
        },
        "children": [
          {
            "type": "Button",
            "name": "Button",
            "settings": {
              "languages": {
                "EN": {
                  "text": "Options"
                }
              },
              "text": "Options",
              "border": {
                "borderWidth": 1,
                "borderColor": "$$primary_color$$",
                "borderTopLeftRadius": 0,
                "borderTopRightRadius": 0,
                "borderBottomLeftRadius": 0,
                "borderBottomRightRadius": 0,
                "borderStyle": "solid"
              },
              "choice_option": {
                "type": 12,
                "data": {
                  "button_text": "1609159698225",
                  "privacy_manager_iframe_url": "https://notice.sp-prod.net/privacy-manager/index.html?message_id=404472",
                  "consent_origin": "https://sourcepoint.mgr.consensu.org/tcfv2"
                }
              },
              "font": {
                "fontSize": 14,
                "fontWeight": "700",
                "color": "$$primary_color$$",
                "fontFamily": "arial, helvetica, sans-serif"
              },
              "background": "#ffffff"
            },
            "children": []
          },
          {
            "type": "Button",
            "name": "Button",
            "settings": {
              "languages": {
                "EN": {
                  "text": "Accept"
                }
              },
              "text": "Accept",
              "border": {
                "borderWidth": 1,
                "borderColor": "$$primary_color$$",
                "borderTopLeftRadius": 0,
                "borderTopRightRadius": 0,
                "borderBottomLeftRadius": 0,
                "borderBottomRightRadius": 0,
                "borderStyle": "solid"
              },
              "choice_option": {
                "type": 11,
                "data": {
                  "button_text": "1596474188251",
                  "consent_origin": "https://sourcepoint.mgr.consensu.org/tcfv2",
                  "consent_language": "EN"
                }
              },
              "background": "#0000b2",
              "font": {
                "fontSize": 14,
                "fontWeight": "700",
                "color": "#ffffff",
                "fontFamily": "arial, helvetica, sans-serif"
              },
              "padding": {
                "paddingLeft": 20,
                "paddingRight": 20,
                "paddingTop": 10,
                "paddingBottom": 10
              }
            },
            "children": []
          }
        ],
        "handle": "bottom-row"
      }
    ],
    "css": ".stack .accordion .chevron { left: auto; }\n\n\n/*Stack Customizations - update default properties as needed*/\n.stack { background-color: #fff !important; }\n.stack .accordion .chevron { color: #000000 !important; }\n.accordion { font-family: arial, helvetica, sans-serif !important; color: #000000 !important; }\n.message-stacks .panel p { font-family: arial, helvetica, sans-serif !important; color: #555555 !important;}\n.message-stacks .panel { border-bottom: 1px solid #e5e9ee !important }\n\n@media only screen and (max-width: 600px) {\n.bottom-row { display: flex; flex-direction: row !important; justify-content: center !important; } \n.header-row { display: flex !important; flex-direction: row !important; }\n}",
    "compliance_list": [
      {
        "1": true
      },
      {
        "2": true
      },
      {
        "3": true
      },
      {
        "4": true
      },
      {
        "5": true
      },
      {
        "6": true
      },
      {
        "7": true
      },
      {
        "8": true
      },
      {
        "9": true
      },
      {
        "10": true
      },
      {
        "11": true
      }
    ],
    "compliance_status": true
  },
  "message_choice": [
    {
      "choice_id": 3306994,
      "type": 15,
      "iframe_url": null,
      "button_text": "Dismiss"
    },
    {
      "choice_id": 3306995,
      "type": 12,
      "iframe_url": "https://notice.sp-prod.net/privacy-manager/index.html?message_id=404472",
      "button_text": "1609159698225"
    },
    {
      "choice_id": 3306996,
      "type": 11,
      "iframe_url": null,
      "button_text": "1596474188251"
    }
  ],
  "categories": [
    {
      "_id": "5f2285ef22eeb81b1348f394",
      "type": "IAB_PURPOSE",
      "name": "Store and/or access information on a device",
      "description": "Cookies, device identifiers, or other information can be stored or accessed on your device for the purposes presented to you."
    },
    {
      "_id": "5f2285ef22eeb81b1348f39c",
      "type": "IAB_PURPOSE",
      "name": "Select basic ads",
      "description": "Ads can be shown to you based on the content you’re viewing, the app you’re using, your approximate location, or your device type."
    },
    {
      "_id": "5f2285ef22eeb81b1348f3a3",
      "type": "IAB_PURPOSE",
      "name": "Create a personalised ads profile",
      "description": "A profile can be built about you and your interests to show you personalised ads that are relevant to you."
    },
    {
      "_id": "5f2285ef22eeb81b1348f3a9",
      "type": "IAB_PURPOSE",
      "name": "Select personalised ads",
      "description": "Personalised ads can be shown to you based on a profile about you."
    },
    {
      "_id": "5f2285ef22eeb81b1348f3af",
      "type": "IAB_PURPOSE",
      "name": "Create a personalised content profile",
      "description": "A profile can be built about you and your interests to show you personalised content that is relevant to you."
    },
    {
      "_id": "5f2285ef22eeb81b1348f3b5",
      "type": "IAB_PURPOSE",
      "name": "Select personalised content",
      "description": "Personalised content can be shown to you based on a profile about you."
    },
    {
      "_id": "5f2285ef22eeb81b1348f3bb",
      "type": "IAB_PURPOSE",
      "name": "Measure ad performance",
      "description": "The performance and effectiveness of ads that you see or interact with can be measured."
    },
    {
      "_id": "5f2285ef22eeb81b1348f3c7",
      "type": "IAB_PURPOSE",
      "name": "Apply market research to generate audience insights",
      "description": "Market research can be used to learn more about the audiences who visit sites/apps and view ads."
    },
    {
      "_id": "5f2285ef22eeb81b1348f3cd",
      "type": "IAB_PURPOSE",
      "name": "Develop and improve products",
      "description": "Your data can be used to improve existing systems and software, and to develop new products"
    },
    {
      "_id": "5e37fc3e973acf1e955b8966",
      "name": "Use precise geolocation data",
      "description": "Your precise geolocation data can be used in support of one or more purposes. This means your location can be accurate to within several meters."
    }
  ],
  "site_id": 10589,
  "language": "en"
}

const renderingAppMessageiOS14 = {
  "message_json": {
    "type": "Notice",
    "name": "GDPR Notice",
    "settings": {
      "showClose": false,
      "border": {
        "borderWidth": 0,
        "borderColor": "#000000",
        "borderTopLeftRadius": 0,
        "borderTopRightRadius": 0,
        "borderBottomLeftRadius": 0,
        "borderBottomRightRadius": 0,
        "borderStyle": "solid"
      },
      "padding": {
        "paddingLeft": 0,
        "paddingRight": 0,
        "paddingTop": 0,
        "paddingBottom": 0
      },
      "selected_privacy_manager": {
        "type": 12,
        "data": {
          "button_text": "1612861627042",
          "privacy_manager_iframe_url": "https://notice.sp-prod.net/privacy-manager/index.html?message_id=404472",
          "consent_origin": "https://sourcepoint.mgr.consensu.org/tcfv2"
        }
      }
    },
    "children": [
      {
        "type": "Row",
        "name": "Row",
        "settings": {
          "align": "space-between",
          "vertical": "center",
          "width": {
            "type": "%",
            "value": 100
          },
          "padding": {
            "paddingLeft": 10,
            "paddingRight": 10,
            "paddingTop": 5,
            "paddingBottom": 0
          },
          "margin": {
            "marginLeft": 0,
            "marginRight": 0,
            "marginTop": 0,
            "marginBottom": 0
          },
          "background": "$$primary_color$$"
        },
        "children": [
          {
            "type": "Text",
            "name": "Text",
            "settings": {
              "languages": {
                "EN": {
                  "text": "<p>Fake iOS 14</p>"
                }
              },
              "text": "<p>Fake iOS 14</p>",
              "font": {
                "fontSize": 32,
                "fontWeight": "700",
                "color": "#444444",
                "fontFamily": "arial, helvetica, sans-serif"
              },
              "padding": {
                "paddingLeft": 0,
                "paddingRight": 0,
                "paddingTop": 0,
                "paddingBottom": 0
              },
              "margin": {
                "marginLeft": 0,
                "marginRight": 0,
                "marginTop": 0,
                "marginBottom": 0
              }
            },
            "children": []
          }
        ],
        "handle": "header-row"
      },
      {
        "type": "Row",
        "name": "Row",
        "settings": {
          "width": {
            "type": "%",
            "value": 100
          },
          "padding": {
            "paddingLeft": 0,
            "paddingRight": 0,
            "paddingTop": 0,
            "paddingBottom": 0
          },
          "margin": {
            "marginLeft": 0,
            "marginRight": 0,
            "marginTop": 0,
            "marginBottom": 0
          }
        },
        "children": [
          {
            "type": "Text",
            "name": "Text",
            "settings": {
              "padding": {
                "paddingLeft": 10,
                "paddingRight": 10,
                "paddingTop": 8,
                "paddingBottom": 8
              },
              "margin": {
                "marginLeft": 0,
                "marginRight": 0,
                "marginTop": 0,
                "marginBottom": 0
              },
              "languages": {
                "EN": {
                  "text": "<p>We and our technology partners ask you to consent to the use of cookies to store and access personal data on your device. This can include the use of unique identifiers and information about your browsing patterns to create the best possible user experience on this website. The following description outlines how your data may be used by us, or by our partners.</p><p>&nbsp;</p><p>Some of our <a href=\"https://google.com\" target=\"_blank\" aria-label=\"message-link\">partners</a> process personal data on the basis of legitimate interest. You can object to such processing at any time. Please click “Options” below to view our list of partners and the purposes for which consent is required.</p><p>&nbsp;</p><p>You don’t have to consent in order to view the information on this site, but if you don’t consent, some personalization of content and advertising won’t be available. Your choices on this site will be applied only to this site. You can change your settings at any time by using the link at the bottom of the page to reopen the Privacy Preferences and managing the setting.</p>"
                }
              },
              "text": "<p>We and our technology partners ask you to consent to the use of cookies to store and access personal data on your device. This can include the use of unique identifiers and information about your browsing patterns to create the best possible user experience on this website. The following description outlines how your data may be used by us, or by our partners.</p><p>&nbsp;</p><p>Some of our <a href=\"https://google.com\" target=\"_blank\" aria-label=\"message-link\">partners</a> process personal data on the basis of legitimate interest. You can object to such processing at any time. Please click “Options” below to view our list of partners and the purposes for which consent is required.</p><p>&nbsp;</p><p>You don’t have to consent in order to view the information on this site, but if you don’t consent, some personalization of content and advertising won’t be available. Your choices on this site will be applied only to this site. You can change your settings at any time by using the link at the bottom of the page to reopen the Privacy Preferences and managing the setting.</p>",
              "choice_options": [],
              "link": {
                "fontWeight": "400",
                "color": "$$primary_color$$",
                "textDecoration": "underline"
              },
              "hover": {
                "fontWeight": "400",
                "color": "$$primary_color$$",
                "textDecoration": "underline"
              }
            },
            "children": []
          }
        ]
      },
      {
        "type": "Stacks",
        "name": "Stacks",
        "settings": {
          "accordionsSpacing": {
            "paddingLeft": 20,
            "paddingRight": 50,
            "paddingTop": 12,
            "paddingBottom": 12
          },
          "panelSpacing": {
            "paddingLeft": 20,
            "paddingRight": 20,
            "paddingTop": 0,
            "paddingBottom": 12
          }
        },
        "children": []
      },
      {
        "type": "Row",
        "name": "Row",
        "settings": {
          "width": {
            "type": "%",
            "value": 100
          },
          "align": "flex-end",
          "padding": {
            "paddingLeft": 0,
            "paddingRight": 10,
            "paddingTop": 0,
            "paddingBottom": 0
          },
          "margin": {
            "marginLeft": 0,
            "marginRight": 0,
            "marginTop": 0,
            "marginBottom": 0
          }
        },
        "children": [
          {
            "type": "Button",
            "name": "Button",
            "settings": {
              "languages": {
                "EN": {
                  "text": "Options"
                }
              },
              "text": "Options",
              "border": {
                "borderWidth": 1,
                "borderColor": "$$primary_color$$",
                "borderTopLeftRadius": 0,
                "borderTopRightRadius": 0,
                "borderBottomLeftRadius": 0,
                "borderBottomRightRadius": 0,
                "borderStyle": "solid"
              },
              "choice_option": {
                "type": 12,
                "data": {
                  "button_text": "1609159698225",
                  "privacy_manager_iframe_url": "https://notice.sp-prod.net/privacy-manager/index.html?message_id=404472",
                  "consent_origin": "https://sourcepoint.mgr.consensu.org/tcfv2"
                }
              },
              "font": {
                "fontSize": 14,
                "fontWeight": "700",
                "color": "$$primary_color$$",
                "fontFamily": "arial, helvetica, sans-serif"
              },
              "background": "#ffffff"
            },
            "children": []
          },
          {
            "type": "Button",
            "name": "Button",
            "settings": {
              "languages": {
                "EN": {
                  "text": "Accept"
                }
              },
              "text": "Accept",
              "border": {
                "borderWidth": 1,
                "borderColor": "$$primary_color$$",
                "borderTopLeftRadius": 0,
                "borderTopRightRadius": 0,
                "borderBottomLeftRadius": 0,
                "borderBottomRightRadius": 0,
                "borderStyle": "solid"
              },
              "choice_option": {
                "type": 11,
                "data": {
                  "button_text": "1596474188251",
                  "consent_origin": "https://sourcepoint.mgr.consensu.org/tcfv2",
                  "consent_language": "EN"
                }
              },
              "background": "#0000b2",
              "font": {
                "fontSize": 14,
                "fontWeight": "700",
                "color": "#ffffff",
                "fontFamily": "arial, helvetica, sans-serif"
              },
              "padding": {
                "paddingLeft": 20,
                "paddingRight": 20,
                "paddingTop": 10,
                "paddingBottom": 10
              }
            },
            "children": []
          }
        ],
        "handle": "bottom-row"
      }
    ],
    "css": ".stack .accordion .chevron { left: auto; }\n\n\n/*Stack Customizations - update default properties as needed*/\n.stack { background-color: #fff !important; }\n.stack .accordion .chevron { color: #000000 !important; }\n.accordion { font-family: arial, helvetica, sans-serif !important; color: #000000 !important; }\n.message-stacks .panel p { font-family: arial, helvetica, sans-serif !important; color: #555555 !important;}\n.message-stacks .panel { border-bottom: 1px solid #e5e9ee !important }\n\n@media only screen and (max-width: 600px) {\n.bottom-row { display: flex; flex-direction: row !important; justify-content: center !important; } \n.header-row { display: flex !important; flex-direction: row !important; }\n}",
    "compliance_list": [
      {
        "1": true
      },
      {
        "2": true
      },
      {
        "3": true
      },
      {
        "4": true
      },
      {
        "5": true
      },
      {
        "6": true
      },
      {
        "7": true
      },
      {
        "8": true
      },
      {
        "9": true
      },
      {
        "10": true
      },
      {
        "11": true
      }
    ],
    "compliance_status": true
  },
  "message_choice": [
    {
      "choice_id": 3306994,
      "type": 15,
      "iframe_url": null,
      "button_text": "Dismiss"
    },
    {
      "choice_id": 3306995,
      "type": 12,
      "iframe_url": "https://notice.sp-prod.net/privacy-manager/index.html?message_id=404472",
      "button_text": "1609159698225"
    },
    {
      "choice_id": 3306996,
      "type": 11,
      "iframe_url": null,
      "button_text": "1596474188251"
    }
  ],
  "categories": [
    {
      "_id": "5f2285ef22eeb81b1348f394",
      "type": "IAB_PURPOSE",
      "name": "Store and/or access information on a device",
      "description": "Cookies, device identifiers, or other information can be stored or accessed on your device for the purposes presented to you."
    },
    {
      "_id": "5f2285ef22eeb81b1348f39c",
      "type": "IAB_PURPOSE",
      "name": "Select basic ads",
      "description": "Ads can be shown to you based on the content you’re viewing, the app you’re using, your approximate location, or your device type."
    },
    {
      "_id": "5f2285ef22eeb81b1348f3a3",
      "type": "IAB_PURPOSE",
      "name": "Create a personalised ads profile",
      "description": "A profile can be built about you and your interests to show you personalised ads that are relevant to you."
    },
    {
      "_id": "5f2285ef22eeb81b1348f3a9",
      "type": "IAB_PURPOSE",
      "name": "Select personalised ads",
      "description": "Personalised ads can be shown to you based on a profile about you."
    },
    {
      "_id": "5f2285ef22eeb81b1348f3af",
      "type": "IAB_PURPOSE",
      "name": "Create a personalised content profile",
      "description": "A profile can be built about you and your interests to show you personalised content that is relevant to you."
    },
    {
      "_id": "5f2285ef22eeb81b1348f3b5",
      "type": "IAB_PURPOSE",
      "name": "Select personalised content",
      "description": "Personalised content can be shown to you based on a profile about you."
    },
    {
      "_id": "5f2285ef22eeb81b1348f3bb",
      "type": "IAB_PURPOSE",
      "name": "Measure ad performance",
      "description": "The performance and effectiveness of ads that you see or interact with can be measured."
    },
    {
      "_id": "5f2285ef22eeb81b1348f3c7",
      "type": "IAB_PURPOSE",
      "name": "Apply market research to generate audience insights",
      "description": "Market research can be used to learn more about the audiences who visit sites/apps and view ads."
    },
    {
      "_id": "5f2285ef22eeb81b1348f3cd",
      "type": "IAB_PURPOSE",
      "name": "Develop and improve products",
      "description": "Your data can be used to improve existing systems and software, and to develop new products"
    },
    {
      "_id": "5e37fc3e973acf1e955b8966",
      "name": "Use precise geolocation data",
      "description": "Your precise geolocation data can be used in support of one or more purposes. This means your location can be accurate to within several meters."
    }
  ],
  "site_id": 10589,
  "language": "en"
}
const messageMetaData = {
  categoryId: 1, // 1: gdpr, 2: ccpa, 4: ios14
  subCategoryId: 5, // 2: PM, 5: TCFv2, 6: NativeInApp, 7: PMOTT, 8: MessageNonTCF, 9: PMNonTCF, 10: ios, 11: CCPAOTT
  messageId: 123
}

router.post('/multi-campaign', async (_req, res) => {
  res.status(200).json({
    campaigns: [
      {
        type: 'gdpr',
        applies: true,
        message: renderingAppMessageGDPR,
        messageMetaData: {
          categoryId: 1,
          subCategoryId: 5,
          messageId: 1
        },
        userConsent: {
          euconsent: 'abc',
          grants: {},
          TCData: {
            foo: "bar"
          }
        }
      },
      {
        type: 'ccpa',
        applies: true,
        message: renderingAppMessageCCPA,
        messageMetaData: {
          categoryId: 2,
          subCategoryId: 5,
          messageId: 2
        },
        userConsent: {
          rejectedCategories: ['abc'],
          rejectedVendors: ['abc'],
          rejectedAll: false,
          status: 'rejectedSoome',
          USPString: 'abc',
        }
      }, 
      {
        type: 'ios14',
        message: renderingAppMessageiOS14,
        messageMetaData: {
          categoryId: 4,
          subCategoryId: 10,
          messageId: 3
        }
      }
    ],
    localState: '{ \"data\": \"local state data\" }'
  })
})

module.exports = router
