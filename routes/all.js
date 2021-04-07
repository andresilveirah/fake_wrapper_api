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
                  "text": "<p>ATT Pre-Prompt</p>"
                }
              },
              "text": "<p>ATT Pre-Prompt</p>",
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
                  "text": "<p>This is a fake iOS 14 Message</p><br /><p>In order to keep our services free, we monetise by serving you personalised ads. All you need to do is tap on \"Allow\" in the next prompt.</p>"
                }
              },
              "text": "<p>This is a fake iOS 14 Message</p><br /><p>In order to keep our services free, we monetise by serving you personalised ads. All you need to do is tap on \"Allow\" in the next prompt.</p>",
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
                  "text": "Got it."
                }
              },
              "text": "Got it.",
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
      "type": 99,
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

const ccpaConsentV2 = {
    "uuid": "82c286df-43d5-412f-bb36-d41aed6c16c5",
    "localState": "{\"gdpr\":{\"mmsCookies\":[\"_sp_v1_uid=1:601:8237cc87-96e0-4971-bb46-e585bfc999a4\",\"_sp_v1_data=2:2356:1617094697:0:1:0:1:0:0:_:-1\",\"_sp_v1_ss=1:H4sIAAAAAAAAAItWqo5RKimOUbKKBjLyQAyD2lidGKVUEDOvNCcHyC4BK6iurVWKBQAW54XRMAAAAA%3D%3D\",\"_sp_v1_opt=1:\",\"_sp_v1_consent=1!-1:-1:-1:-1:-1:-1\",\"_sp_v1_stage=\",\"_sp_v1_csv=null\",\"_sp_v1_lt=1:\"],\"uuid\":\"314296a6-b3f0-43da-b485-427707b679f2\",\"propertyId\":3949,\"messageId\":12223},\"ccpa\":{\"mmsCookies\":[\"_sp_v1_uid=1:741:38851434-d8ce-4528-a0bf-ff3fb81b3ebb\",\"_sp_v1_data=2:2358:1617094697:0:1:0:1:0:0:_:-1\",\"_sp_v1_ss=1:H4sIAAAAAAAAAItWqo5RKimOUbKKBjLyQAyD2lidGKVUEDOvNCcHyC4BK6iurVWKBQAW54XRMAAAAA%3D%3D\",\"_sp_v1_opt=1:\",\"_sp_v1_consent=1!-1:-1:-1:-1:-1:-1\",\"_sp_v1_stage=\",\"_sp_v1_csv=null\",\"_sp_v1_lt=1:\"],\"uuid\":\"c04877c9-e809-4e7f-8cb3-1ca22114b0be\",\"dnsDisplayed\":true,\"status\":\"rejectedNone\",\"propertyId\":3949,\"messageId\":12224},\"status\":\"consentedAll\"}",
    "ccpaApplies": false,
    "userConsent": {
        "uspstring": "1---",
        "status": "consentedAll",
        "rejectedVendors": [],
        "rejectedCategories": []
    }
}

const gdprConsentV2 = {
    "uuid": "aaa",
    "localState": "{\"mmsCookies\":[\"_sp_v1_uid=1:727:160de0df-7177-4878-a3fd-80f47a0fe4ea;\",\"_sp_v1_data=2:0:1617784992:0:0:-1:0:0:0:_:-1;\",\"_sp_v1_ss=null;\",\"_sp_v1_opt=1:;\",\"_sp_v1_consent=1!1:1:-1:-1:-1:-1;\",\"_sp_v1_stage=;\",\"_sp_v1_csv=;\",\"_sp_v1_lt=1:;\"]}",
    "userConsent": {
        "euconsent": "CPERmZFPERmZFAGABCENBUCgAP_AAH_AAAYgGVtL9X9fYW_j-f599_t0eY1f9163t-gjihcFk8QJwZ_X_J4Sp2MyPAmooiQKGRAEsHLBAAVFHGHUTQAAwIkVoRLkYkWMDzEKI7JAAkMbEmUYED1snMTTGJCYr0s__ny6uk-P7-8H7IGRgAEAAKAAACCAAAEChEIAAIAxIAAAAAihEAgEAAARQADI4COAAAAAAIgAQAAQAgIAYBAAAAAEkAQAABQIBAARAAAAQACAEAACAAAEgBACAAACAEhAARABCBAQAAAAQgAAEABAACgJDICgAFAAhgBMAC4AI4AZYA1IB9gH4ARgAjgBVwDeAJiATYAtEBbAC8wGBAMPAZEIgKgBWAC4AIYAZAAywBqAD8AIAARgAq4BrAD5AIvASIAmwBOwC5AGBAMJAYeAycQABAXQEggAALgAoACoAGQAOAAeABAACIAGEANAA1AB5AEMARQAmABPgCqAKwAWAAuABvADmAHoAQgAhoBEAESAJYATQApQBkADLAGoAO8AewA-IB9gH6AQAAjABHACUgFXALmAX4AxQBrADaAG4AN4AegA-QCLwEiAJiATYAnYBQ4CxQFsALkAXeAvMBgQDCQGGgMPAZEAyQBk4UAEAL4AYQQAGARoA0QDIw0BgAKwAXABDADIAGWANQAfgBAACMAFXANYAbwA-QCKgEXgJEATYAnYBcgDAgGEgMPAYwAycOABANkGAAgLoFQFgAKABDACYAFwARwAywBqAD8AIwARwAq4BvAEggJiATYApsBbAC5AF5gMCAYeAyIdBHAAXABQAFQAMgAcABAACKAGAAYwA0ADUAHgAPoAhgCKAEwAJ8AVQBWACwAFwAMQAZgA3gBzAD0AIQAQwAiABLACYAE0AKMAUoAsQBkADKAGiANQAb4A7wB7QD7AP0AjABHACUgFXALEAXMAvwBigDaAG4gOmA6gB6AERAIvASCAkQBNgCdgFDgLFgWwBbIC4AFyALtAXeAvMBhIDDQGHgMSAYwAyQBk44AEABcAjJCBYAAsACgAGQARAAxACGAEwAKoAXAAxABmADeAHoARwAsQBlADUAG-AO-AfYB-AEYAI4ASkAoYBVwC5gF-AMUAbQA6gB6AEggJEATYAsUBaMC2ALaAXAAuQBdoDDwGJAMiAZOQAAgEZJQKAAFgAUAAyABwAEUAMAAxAB4AEQAJgAVQAuABiADMAG0AQgAhoBEAESAKMAUoAwgBlADvAH4ARgAjgBVwDFAG4AOoAfIBF4CRAE2ALFAWwAu0BeYDDwGRAMnJAAgALgEZKQOAAFwAUABUADIAHAAQAAigBgAGMANAA1AB5AEMARQAmABPACkAFUALAAXAAxABmADmAIQAQwAiABRgClAFiAMoAaIA74B9gH6ARgAjgBKQChgFXALmAbQA3AB6AEXgJEATYAnYBQ4CtgFigLYAXAAuQBdoC8wGGgMPAYwAyIBkgDJygAIAC4BIgAAA.YAAAAAAAAAAA",
        "acceptedVendors": [
            "5f1b2fbeb8e05c30686fd72a",
            "5eb32dea09c3f947e75e6f02"
        ],
        "acceptedCategories": [
            "5f31cdf48fe52a6a6313f061",
            "5f31cdf48fe52a6a6313f03f",
            "5f31cdf48fe52a6a6313f012",
            "5f31cdf48fe52a6a6313f02b",
            "5f31cdf48fe52a6a6313f053",
            "5f31cdf48fe52a6a6313f06c",
            "5f31cdf48fe52a6a6313f087",
            "5f31cdf48fe52a6a6313f097",
            "5f31cdf48fe52a6a6313f0a9",
            "5f31cdf48fe52a6a6313eff6"
        ],
        "specialFeatures": [],
        "legIntCategories": [],
        "grants": {
            "5f1aada6b8e05c306c0597d7": {
                "vendorGrant": true,
                "purposeGrants": {
                    "5f31cdf48fe52a6a6313f061": true,
                    "5f31cdf48fe52a6a6313f03f": true,
                    "5f31cdf48fe52a6a6313f012": true,
                    "5f31cdf48fe52a6a6313f02b": true,
                    "5f31cdf48fe52a6a6313f053": true,
                    "5f31cdf48fe52a6a6313f06c": true,
                    "5f31cdf48fe52a6a6313f097": true,
                    "5f31cdf48fe52a6a6313f0a9": true,
                    "5f31cdf48fe52a6a6313eff6": true
                }
            },
            "5e7ced57b8e05c47d7081590": {
                "vendorGrant": true,
                "purposeGrants": {
                    "5f31cdf48fe52a6a6313f061": true,
                    "5f31cdf48fe52a6a6313f03f": true,
                    "5f31cdf48fe52a6a6313f012": true,
                    "5f31cdf48fe52a6a6313f02b": true,
                    "5f31cdf48fe52a6a6313f053": true,
                    "5f31cdf48fe52a6a6313f06c": true,
                    "5f31cdf48fe52a6a6313f087": true,
                    "5f31cdf48fe52a6a6313f097": true,
                    "5f31cdf48fe52a6a6313f0a9": true,
                    "5f31cdf48fe52a6a6313eff6": true
                }
            }
        },
        "TCData": {
            "IABTCF_AddtlConsent": "1~505.2628.1024.162.2677",
            "IABTCF_CmpSdkID": 6,
            "IABTCF_CmpSdkVersion": 2,
            "IABTCF_PolicyVersion": 2,
            "IABTCF_PublisherCC": "DE",
            "IABTCF_PurposeOneTreatment": 0,
            "IABTCF_UseNonStandardStacks": 0,
            "IABTCF_TCString": "CPERmZFPERmZFAGABCENBUCgAP_AAH_AAAYgGVtL9X9fYW_j-f599_t0eY1f9163t-gjihcFk8QJwZ_X_J4Sp2MyPAmooiQKGRAEsHLBAAVFHGHUTQAAwIkVoRLkYkWMDzEKI7JAAkMbEmUYED1snMTTGJCYr0s__ny6uk-P7-8H7IGRgAEAAKAAACCAAAEChEIAAIAxIAAAAAihEAgEAAARQADI4COAAAAAAIgAQAAQAgIAYBAAAAAEkAQAABQIBAARAAAAQACAEAACAAAEgBACAAACAEhAARABCBAQAAAAQgAAEABAACgJDICgAFAAhgBMAC4AI4AZYA1IB9gH4ARgAjgBVwDeAJiATYAtEBbAC8wGBAMPAZEIgKgBWAC4AIYAZAAywBqAD8AIAARgAq4BrAD5AIvASIAmwBOwC5AGBAMJAYeAycQABAXQEggAALgAoACoAGQAOAAeABAACIAGEANAA1AB5AEMARQAmABPgCqAKwAWAAuABvADmAHoAQgAhoBEAESAJYATQApQBkADLAGoAO8AewA-IB9gH6AQAAjABHACUgFXALmAX4AxQBrADaAG4AN4AegA-QCLwEiAJiATYAnYBQ4CxQFsALkAXeAvMBgQDCQGGgMPAZEAyQBk4UAEAL4AYQQAGARoA0QDIw0BgAKwAXABDADIAGWANQAfgBAACMAFXANYAbwA-QCKgEXgJEATYAnYBcgDAgGEgMPAYwAycOABANkGAAgLoFQFgAKABDACYAFwARwAywBqAD8AIwARwAq4BvAEggJiATYApsBbAC5AF5gMCAYeAyIdBHAAXABQAFQAMgAcABAACKAGAAYwA0ADUAHgAPoAhgCKAEwAJ8AVQBWACwAFwAMQAZgA3gBzAD0AIQAQwAiABLACYAE0AKMAUoAsQBkADKAGiANQAb4A7wB7QD7AP0AjABHACUgFXALEAXMAvwBigDaAG4gOmA6gB6AERAIvASCAkQBNgCdgFDgLFgWwBbIC4AFyALtAXeAvMBhIDDQGHgMSAYwAyQBk44AEABcAjJCBYAAsACgAGQARAAxACGAEwAKoAXAAxABmADeAHoARwAsQBlADUAG-AO-AfYB-AEYAI4ASkAoYBVwC5gF-AMUAbQA6gB6AEggJEATYAsUBaMC2ALaAXAAuQBdoDDwGJAMiAZOQAAgEZJQKAAFgAUAAyABwAEUAMAAxAB4AEQAJgAVQAuABiADMAG0AQgAhoBEAESAKMAUoAwgBlADvAH4ARgAjgBVwDFAG4AOoAfIBF4CRAE2ALFAWwAu0BeYDDwGRAMnJAAgALgEZKQOAAFwAUABUADIAHAAQAAigBgAGMANAA1AB5AEMARQAmABPACkAFUALAAXAAxABmADmAIQAQwAiABRgClAFiAMoAaIA74B9gH6ARgAjgBKQChgFXALmAbQA3AB6AEXgJEATYAnYBQ4CtgFigLYAXAAuQBdoC8wGGgMPAYwAyIBkgDJygAIAC4BIgAAA.YAAAAAAAAAAA",
            "IABTCF_VendorConsents": "1101001011111101010111111101011111011000010110111111100011111110011111111001111101111101111111101101110100011110011000110101011111111101110101111010110111101101111110100000100011100010100001011100000101100100111100010000001001110000011001111111010111111111001001111000010010101001110110001100110010001111000000100110101000101000100010010000001010000110010001000000000100101100000111001011000001000000000000010101000101000111000110000111010100010011010000000000000000110000001000100100010101101000010001001011100100011000100100010110001100000011110011000100001010001000111011001001000000000000100100001100011011000100100110010100011000000100000011110101101100100111001100010011010011000110001001000010011000101011110100101100111111111111100111110010111010101110100100111110001111111011111110111100000111111011001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            "IABTCF_VendorLegitimateInterests": "0000000000000100000000000000001010000000000000000000000010000010000000000000000000000100000010100001000100001000000000000000001000000000110001001000000000000000000000000000000000100010100001000100000000100000000100000000000000000000010001010000000000000011001000111000000010001110000000000000000000000000000000000000001000100000000000010000000000000000010000000000100000001000000000011000000001000000000000000000000000000000000100100100000000010000000000000000000001010000001000000001000000000000010001000000000000000000000000010000000000000010000000000100000000000000000010000000000000000000000100100000000001000000000010000000000000000000000010000000000100100001000000000000010001000000000001000010000001000000010000000000000000000000000000010000100000000000000000000100000000000001000000000000000010100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            "IABTCF_PurposeConsents": "1111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            "IABTCF_PurposeLegitimateInterests": "0111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            "IABTCF_SpecialFeaturesOptIns": "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            "IABTCF_PublisherConsent": "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            "IABTCF_PublisherLegitimateInterests": "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            "IABTCF_PublisherCustomPurposesConsents": "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            "IABTCF_PublisherCustomPurposesLegitimateInterests": "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            "IABTCF_gdprApplies": 1,
            "IABTCF_PublisherRestrictions6": "0000000000000000000100000000000000000000000000000000000000000000001000000001000000000000000100000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000100000000100000000000000000000000000000000000000110000000000000000000000000001000100000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000100000000000000000000000000100000000000000100000000000010000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            "IABTCF_PublisherRestrictions4": "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            "IABTCF_PublisherRestrictions2": "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            "IABTCF_PublisherRestrictions3": "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            "IABTCF_PublisherRestrictions5": "0000000000000000000100000000000000000000000000000000000000000000001000000001000000000000000100000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000100000000100000000000000000000000000000000000000010000000000000000000000000001000100000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000001000000000100000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000100000000000100000000000000100000000000000100000000000010000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            "IABTCF_PublisherRestrictions7": "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            "IABTCF_PublisherRestrictions8": "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            "IABTCF_PublisherRestrictions9": "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            "IABTCF_PublisherRestrictions10": "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
        }
    }
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

router.post('/gdpr-consent', async (_req, res) => {
    res.status(200).json(gdprConsentV2)
  })

router.post('/consent/:actionType', async (_req, res) => {
    res.status(200).json(ccpaConsentV2)
})

module.exports = router
