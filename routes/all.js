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
              "background": "$$primary_color$$",
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
    "name": "TCFv2 Basic Modal",
    "settings": {
      "showClose": true,
      "useBrowserDefault": true,
      "width": {
        "type": "px",
        "value": 600
      },
      "border": {
        "borderWidth": 1,
        "borderColor": "#ffffff",
        "borderTopLeftRadius": 0,
        "borderTopRightRadius": 0,
        "borderBottomLeftRadius": 0,
        "borderBottomRightRadius": 0,
        "borderStyle": "solid"
      },
      "defaultLanguage": "EN",
      "selectedLanguage": "EN",
      "closeAlign": "right",
      "closeFont": {
        "fontSize": 24,
        "fontWeight": "800",
        "color": "#999999",
        "fontFamily": "tahoma,geneva,sans-serif"
      },
      "useSafeArea": true
    },
    "children": [
      {
        "type": "Row",
        "name": "Row",
        "settings": {
          "align": "space-between",
          "padding": {
            "paddingLeft": 8,
            "paddingRight": 8,
            "paddingTop": 0,
            "paddingBottom": 0
          },
          "margin": {
            "marginLeft": 0,
            "marginRight": 0,
            "marginTop": 0,
            "marginBottom": 0
          },
          "selectedLanguage": "EN"
        },
        "children": [
          {
            "type": "Text",
            "name": "Text",
            "settings": {
              "languages": {
                "EN": {
                  "text": "<p>Hacked iOS 14</p>"
                },
                "ES": {
                  "text": "<p>Aviso de Privacidad</p>"
                },
                "DE": {
                  "text": "<p>Datenschutzerklärung</p>"
                },
                "FR": {
                  "text": "<p>Avis de Confidentialité</p>"
                }
              },
              "text": "<p>Privacy Notice</p>",
              "font": {
                "fontSize": 32,
                "fontWeight": "700",
                "color": "#000000",
                "fontFamily": "arial, helvetica, sans-serif"
              },
              "padding": {
                "paddingLeft": 0,
                "paddingRight": 0,
                "paddingTop": 10,
                "paddingBottom": 10
              },
              "margin": {
                "marginLeft": 0,
                "marginRight": 0,
                "marginTop": 10,
                "marginBottom": 10
              },
              "selectedLanguage": "EN"
            },
            "children": [],
            "handle": ""
          },
          {
            "type": "Image",
            "name": "Image",
            "settings": {
              "width": {
                "type": "px",
                "value": 184
              },
              "url": "https://www.sourcepoint.com/wp-content/themes/sourcepoint/assets/svg/logo.svg",
              "margin": {
                "marginLeft": 10,
                "marginRight": 10,
                "marginTop": 10,
                "marginBottom": 10
              },
              "height": {
                "type": "px",
                "value": 55
              }
            },
            "children": [],
            "handle": "logo"
          }
        ],
        "handle": "header-row"
      },
      {
        "type": "Row",
        "name": "Row",
        "settings": {
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
          },
          "selectedLanguage": "EN"
        },
        "children": [
          {
            "type": "Text",
            "name": "Text",
            "settings": {
              "languages": {
                "EN": {
                  "text": "<p>SourcePoint and our technology partners ask you to consent to the use, store and access of personal data on your device. This can include the use of unique identifiers and information about your browsing patterns to create the best possible user experience on our app. The following description outlines how your data may be used by us, or by our partners.</p><p>&nbsp;</p><p>Some of our partners process personal data on the basis of legitimate interest. You can object to such processing at any time. Please click “Options” below to view our list of partners and the purposes for which consent is required.</p><p><br></p><p>You can view our <a href=\"https://sourcepoint.com\" target=\"_blank\">Privacy Policy</a> for more information.</p>"
                },
                "ES": {
                  "text": "<p>[Client Name] y nuestros socios tecnológicos le solicitan su consentimiento para el uso de cookies para almacenar y acceder a datos personales en su dispositivo. Esto puede incluir el uso de identificadores únicos e información sobre sus patrones de navegación para crear la mejor experiencia de usuario posible en este sitio web. La siguiente descripción detalla cómo sus datos pueden ser utilizados por nosotros o por nuestros socios.</p><p>&nbsp;</p><p>Algunos de nuestros <u>socios</u> procesan datos personales sobre la base de intereses legítimos. Puede oponerse a dicho procesamiento en cualquier momento. Haga clic en \"Opciones\" a continuación para ver nuestra lista de socios y los fines para los que se requiere el consentimiento.</p><p>&nbsp;</p><p>No tiene que dar su consentimiento para ver la información en este sitio, pero si no lo hace, no estará disponible alguna personalización de contenido y publicidad. Sus elecciones en este sitio web se aplicarán solo a esta página. Puede cambiar su configuración en cualquier momento utilizando el enlace en la parte inferior de la página para volver a abrir las preferencias de privacidad y administrar la configuración.</p>"
                },
                "DE": {
                  "text": "<p>Wir benötigen Ihre Zustimmung zur Verwendung von Cookies und anderen Technologien durch uns und unsere Partner, um persönliche Daten auf Ihrem Gerät zu speichern und zu verarbeiten. Diese umfassen unter anderem Wiedererkennungsmerkmale, die dazu dienen Ihnen die bestmögliche Nutzererfahrung auf diesem Angebot zu ermöglichen. Im Folgenden finden Sie eine Übersicht zu welchen Zwecken wir Ihre Daten verarbeiten.</p><p>&nbsp;</p><p>Einige unserer <u>Partner</u> verarbeiten Ihre Daten auf Grundlage von berechtigtem Interesse, welches Sie jederzeit widerrufen können. Weitere Informationen zu den Datenverabeitungszwecken sowie unseren Partnern finden Sie unter “Einstellungen”.</p><p>&nbsp;</p><p>Es besteht keine Verpflichtung der Verarbeitung Ihrer Daten zuzustimmen, um dieses Angebot zu nutzen. Ohne Ihre Zustimmung können wir Ihnen keine Inhalte anzeigen, für die eine Personalisierung erforderlich ist. Sie können Ihre Auswahl jederzeit unter unter “Einstellungen” am Seitenende widerrufen oder anpassen. Ihre Auswahl wird ausschließlich auf dieses Angebot angewendet.</p>"
                },
                "FR": {
                  "text": "<p>[Nom du client] et nos partenaires technologiques vous demandent de consentir à l'utilisation de cookies pour stocker et accéder à des données personnelles sur votre appareil. Cela peut inclure l'utilisation d'identifiants uniques et d'informations sur vos habitudes de navigation afin de créer la meilleure expérience possible pour l'utilisateur sur ce site web. La description suivante décrit comment vos données peuvent être utilisées par nous, ou par nos partenaires.</p><p><br></p><p>Certains de nos <u>partenaires</u> traitent les données personnelles sur la base d'un intérêt légitime. Vous pouvez vous opposer à ce traitement à tout moment. Veuillez cliquer sur \"Options\" ci-dessous pour consulter la liste de nos partenaires et les finalités pour lesquelles le consentement est requis.</p><p>&nbsp;</p><p>Vous n'avez pas à donner votre consentement pour consulter les informations sur ce site, mais si vous ne le faites pas, vous ne pourrez pas personnaliser le contenu et la publicité. Vos choix sur ce site ne seront appliqués qu'à ce site. Vous pouvez modifier vos paramètres à tout moment en utilisant le lien en bas de la page pour rouvrir les préférences de confidentialité et gérer le paramètre.</p>"
                }
              },
              "text": "<p>SourcePoint and our technology partners ask you to consent to the use, store and access of personal data on your device. This can include the use of unique identifiers and information about your browsing patterns to create the best possible user experience on our app. The following description outlines how your data may be used by us, or by our partners.</p><p>&nbsp;</p><p>Some of our partners process personal data on the basis of legitimate interest. You can object to such processing at any time. Please click “Options” below to view our list of partners and the purposes for which consent is required.</p><p><br></p><p>You can view our <a href=\"https://sourcepoint.com\" target=\"_blank\">Privacy Policy</a> for more information.</p>",
              "padding": {
                "paddingLeft": 9,
                "paddingRight": 8,
                "paddingTop": 8,
                "paddingBottom": 8
              },
              "margin": {
                "marginLeft": 0,
                "marginRight": 0,
                "marginTop": 0,
                "marginBottom": 0
              },
              "selectedLanguage": "EN"
            },
            "children": [],
            "handle": ""
          }
        ]
      },
      {
        "type": "Stacks",
        "name": "Stacks",
        "settings": {
          "accordionsSpacing": {
            "paddingLeft": 16,
            "paddingRight": 16,
            "paddingTop": 16,
            "paddingBottom": 16
          },
          "selectedLanguage": "EN"
        },
        "children": [],
        "handle": ""
      },
      {
        "type": "Row",
        "name": "Row",
        "settings": {
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
          },
          "align": "flex-end",
          "selectedLanguage": "EN"
        },
        "children": [
          {
            "type": "Button",
            "name": "Button",
            "settings": {
              "languages": {
                "EN": {
                  "text": "Options"
                },
                "ES": {
                  "text": "Opciones"
                },
                "DE": {
                  "text": "Einstellungen"
                },
                "FR": {
                  "text": "Options"
                }
              },
              "text": "Options",
              "choice_option": {
                "type": 12,
                "data": {
                  "button_text": "1598878679394",
                  "privacy_manager_iframe_url": "https://notice.sp-prod.net/privacy-manager/index.html?message_id=122058&pmTab=features",
                  "consent_origin": "https://sourcepoint.mgr.consensu.org/tcfv2"
                }
              },
              "font": {
                "fontSize": 14,
                "fontWeight": "700",
                "color": "#000000",
                "fontFamily": "arial, helvetica, sans-serif"
              },
              "border": {
                "borderWidth": 1,
                "borderColor": "#000000",
                "borderTopLeftRadius": 0,
                "borderTopRightRadius": 0,
                "borderBottomLeftRadius": 0,
                "borderBottomRightRadius": 0,
                "borderStyle": "solid"
              },
              "background": "#ffffff",
              "selectedLanguage": "EN"
            },
            "children": [],
            "handle": ""
          },
          {
            "type": "Button",
            "name": "Reject",
            "settings": {
              "languages": {
                "EN": {
                  "text": "Reject"
                }
              },
              "text": "Reject",
              "choice_option": {
                "type": 13,
                "data": {
                  "button_text": "1592840139599",
                  "consent_origin": "https://sourcepoint.mgr.consensu.org/tcfv2",
                  "consent_language": "EN"
                }
              },
              "padding": {
                "paddingLeft": 18,
                "paddingRight": 18,
                "paddingTop": 10,
                "paddingBottom": 10
              },
              "border": {
                "borderWidth": 1,
                "borderColor": "#7b0f08",
                "borderTopLeftRadius": 0,
                "borderTopRightRadius": 0,
                "borderBottomLeftRadius": 0,
                "borderBottomRightRadius": 0,
                "borderStyle": "solid"
              },
              "background": "#ff1600"
            },
            "children": []
          },
          {
            "type": "Button",
            "name": "Button",
            "settings": {
              "choice_option": {
                "type": 11,
                "data": {
                  "button_text": "1589214494409",
                  "consent_origin": "https://sourcepoint.mgr.consensu.org/tcfv2",
                  "consent_language": "EN"
                }
              },
              "languages": {
                "EN": {
                  "text": "Accept"
                },
                "ES": {
                  "text": "Aceptar"
                },
                "DE": {
                  "text": "Akzeptieren"
                },
                "FR": {
                  "text": "J'accepte"
                }
              },
              "text": "Accept",
              "font": {
                "fontSize": 14,
                "fontWeight": "700",
                "color": "#fff",
                "fontFamily": "arial, helvetica, sans-serif"
              },
              "border": {
                "borderWidth": 1,
                "borderColor": "#008000",
                "borderTopLeftRadius": 0,
                "borderTopRightRadius": 0,
                "borderBottomLeftRadius": 0,
                "borderBottomRightRadius": 0,
                "borderStyle": "solid"
              },
              "background": "#61B329\t",
              "selectedLanguage": "EN",
              "padding": {
                "paddingLeft": 18,
                "paddingRight": 18,
                "paddingTop": 10,
                "paddingBottom": 10
              }
            },
            "children": [],
            "handle": "buttons-row"
          }
        ],
        "handle": "bottom-row"
      }
    ],
    "css": ".stack .accordion .chevron { right: 12px !important; left: auto; }\n\n\n/*Stack Customizations - update default properties as needed*/\n.stack { background-color: #fff !important; }\n.stack .accordion .chevron { color: #000000 !important; }\n.accordion { font-family: arial, helvetica, sans-serif !important; color: #000000 !important; }\n.message-stacks .panel p { font-family: arial, helvetica, sans-serif !important; color: #555555 !important;}\n.message-stacks .panel { border-bottom: 1px solid #e5e9ee !important }\n\n@media only screen and (max-width: 600px) {\n.bottom-row { display: flex; flex-direction: row !important; justify-content: center !important; } \n.header-row { display: flex !important; flex-direction: row !important; }\n.logo { left: 35px !important; right: auto; }\n}",
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
  "actions": [
    {
      "type": "inline",
      "js": "var cookie='consentUUID=55418eb7-8f4a-46c6-a6f8-02271a96ce30; Path=/; Max-Age=31536000; expires=Sat, 12 Mar 2022 11:25:32 GMT;';\nif (false) {\n  var h = window.location && window.location.hostname;\n  if (h) {\n    var rc = (/.co.uk$/.test(h) || /.com.br$/.test(h) || /.com.au$/.test(h) || /.co.nz$/.test(h) ) ? 3 : 2;\n    var ha = h.split('.');\n    var rda = ha.slice(ha.length - rc);\n    if (rda.length > 1) {\n      var rd = rda.join('.');\n      cookie += ' Domain=' + rd + ';';\n    }\n  }\n}\ndocument.cookie = cookie;\n"
    },
    {
      "type": "inline",
      "js": " var writeCookie = window._sp_.writeCookie || function(){}; writeCookie(\"_sp_v1_uid=1:866:336ad269-d46e-4939-8b18-f4c0428f07bf; Max-Age=2592000; Path=/;\"); writeCookie(\"_sp_v1_data=2:273278:1615548332:0:1:0:1:0:0:72a61b07-9933-4968-9ac2-84528707387a:-1; Max-Age=2592000; Path=/;\"); writeCookie(\"_sp_v1_ss=1:H4sIAAAAAAAAAItWqo5RKimOUbKKBjLyQAyD2lidGKVUEDOvNCcHyC4BK6iurVWKBQAW54XRMAAAAA%3D%3D; Max-Age=2592000; Path=/;\"); writeCookie(\"_sp_v1_opt=1:; Max-Age=2592000; Path=/;\"); writeCookie(\"_sp_v1_consent=1!0:-1:-1:-1:-1:-1; Max-Age=2592000; Path=/;\"); writeCookie(\"_sp_v1_stage=; Max-Age=0; Path=/;\"); writeCookie(\"_sp_v1_csv=null; Max-Age=2592000; Path=/;\"); writeCookie(\"_sp_v1_lt=1:; Max-Age=2592000; Path=/;\");"
    }
  ],
  "stackInfo": {
    "categories": [
      {
        "_id": "5e87321eb31ef52cd96cc552",
        "type": "IAB_PURPOSE",
        "name": "Store and/or access information on a device",
        "description": "Cookies, device identifiers, or other information can be stored or accessed on your device for the purposes presented to you."
      },
      {
        "_id": "5e87321eb31ef52cd96cc553",
        "type": "IAB_PURPOSE",
        "name": "Select basic ads",
        "description": "Ads can be shown to you based on the content you’re viewing, the app you’re using, your approximate location, or your device type."
      },
      {
        "_id": "5e87321eb31ef52cd96cc554",
        "type": "IAB_PURPOSE",
        "name": "Create a personalised ads profile",
        "description": "A profile can be built about you and your interests to show you personalised ads that are relevant to you."
      },
      {
        "_id": "5e87321eb31ef52cd96cc555",
        "type": "IAB_PURPOSE",
        "name": "Select personalised ads",
        "description": "Personalised ads can be shown to you based on a profile about you."
      },
      {
        "_id": "5e87321eb31ef52cd96cc556",
        "type": "IAB_PURPOSE",
        "name": "Create a personalised content profile",
        "description": "A profile can be built about you and your interests to show you personalised content that is relevant to you."
      },
      {
        "_id": "5e87321eb31ef52cd96cc558",
        "type": "IAB_PURPOSE",
        "name": "Select personalised content",
        "description": "Personalised content can be shown to you based on a profile about you."
      },
      {
        "_id": "5e87321eb31ef52cd96cc559",
        "type": "IAB_PURPOSE",
        "name": "Measure ad performance",
        "description": "The performance and effectiveness of ads that you see or interact with can be measured."
      },
      {
        "_id": "5e87321eb31ef52cd96cc55a",
        "type": "IAB_PURPOSE",
        "name": "Measure content performance",
        "description": "The performance and effectiveness of content that you see or interact with can be measured."
      },
      {
        "_id": "5e87321eb31ef52cd96cc55b",
        "type": "IAB_PURPOSE",
        "name": "Apply market research to generate audience insights",
        "description": "Market research can be used to learn more about the audiences who visit sites/apps and view ads."
      },
      {
        "_id": "5e87321eb31ef52cd96cc55c",
        "type": "IAB_PURPOSE",
        "name": "Develop and improve products",
        "description": "Your data can be used to improve existing systems and software, and to develop new products"
      }
    ],
    "language": "en"
  },
  "choiceOptions": [
    {
      "choice_id": 3108752,
      "type": 15,
      "iframe_url": null,
      "button_text": "Dismiss"
    },
    {
      "choice_id": 3108753,
      "type": 12,
      "iframe_url": "https://notice.sp-prod.net/privacy-manager/index.html?message_id=122058&pmTab=features",
      "button_text": "1598878679394"
    },
    {
      "choice_id": 3108754,
      "type": 13,
      "iframe_url": null,
      "button_text": "1592840139599"
    },
    {
      "choice_id": 3108755,
      "type": 11,
      "iframe_url": null,
      "button_text": "1589214494409"
    }
  ]
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
