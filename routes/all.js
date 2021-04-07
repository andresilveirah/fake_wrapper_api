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

const renderingAppMessage = {
  "message_json": {
    "type": "Notice",
    "name": "TCFv2 Basic Modal ",
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
                  "text": "<p>Privacy Notice</p>"
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

const gdprConsentV2 = {
  "uuid": "aaa",
  "meta": "{\"mmsCookies\":[\"_sp_v1_uid=1:727:160de0df-7177-4878-a3fd-80f47a0fe4ea;\",\"_sp_v1_data=2:0:1617784992:0:0:-1:0:0:0:_:-1;\",\"_sp_v1_ss=null;\",\"_sp_v1_opt=1:;\",\"_sp_v1_consent=1!1:1:-1:-1:-1:-1;\",\"_sp_v1_stage=;\",\"_sp_v1_csv=;\",\"_sp_v1_lt=1:;\"]}",
  "userConsent": {
      "euconsent": "CPERmZFPERmZFAGABCENBUCgAP_AAH_AAAYgGVtL9X9fYW_j-f599_t0eY1f9163t-gjihcFk8QJwZ_X_J4Sp2MyPAmooiQKGRAEsHLBAAVFHGHUTQAAwIkVoRLkYkWMDzEKI7JAAkMbEmUYED1snMTTGJCYr0s__ny6uk-P7-8H7IGRgAEAAKAAACCAAAEChEIAAIAxIAAAAAihEAgEAAARQADI4COAAAAAAIgAQAAQAgIAYBAAAAAEkAQAABQIBAARAAAAQACAEAACAAAEgBACAAACAEhAARABCBAQAAAAQgAAEABAACgJDICgAFAAhgBMAC4AI4AZYA1IB9gH4ARgAjgBVwDeAJiATYAtEBbAC8wGBAMPAZEIgKgBWAC4AIYAZAAywBqAD8AIAARgAq4BrAD5AIvASIAmwBOwC5AGBAMJAYeAycQABAXQEggAALgAoACoAGQAOAAeABAACIAGEANAA1AB5AEMARQAmABPgCqAKwAWAAuABvADmAHoAQgAhoBEAESAJYATQApQBkADLAGoAO8AewA-IB9gH6AQAAjABHACUgFXALmAX4AxQBrADaAG4AN4AegA-QCLwEiAJiATYAnYBQ4CxQFsALkAXeAvMBgQDCQGGgMPAZEAyQBk4UAEAL4AYQQAGARoA0QDIw0BgAKwAXABDADIAGWANQAfgBAACMAFXANYAbwA-QCKgEXgJEATYAnYBcgDAgGEgMPAYwAycOABANkGAAgLoFQFgAKABDACYAFwARwAywBqAD8AIwARwAq4BvAEggJiATYApsBbAC5AF5gMCAYeAyIdBHAAXABQAFQAMgAcABAACKAGAAYwA0ADUAHgAPoAhgCKAEwAJ8AVQBWACwAFwAMQAZgA3gBzAD0AIQAQwAiABLACYAE0AKMAUoAsQBkADKAGiANQAb4A7wB7QD7AP0AjABHACUgFXALEAXMAvwBigDaAG4gOmA6gB6AERAIvASCAkQBNgCdgFDgLFgWwBbIC4AFyALtAXeAvMBhIDDQGHgMSAYwAyQBk44AEABcAjJCBYAAsACgAGQARAAxACGAEwAKoAXAAxABmADeAHoARwAsQBlADUAG-AO-AfYB-AEYAI4ASkAoYBVwC5gF-AMUAbQA6gB6AEggJEATYAsUBaMC2ALaAXAAuQBdoDDwGJAMiAZOQAAgEZJQKAAFgAUAAyABwAEUAMAAxAB4AEQAJgAVQAuABiADMAG0AQgAhoBEAESAKMAUoAwgBlADvAH4ARgAjgBVwDFAG4AOoAfIBF4CRAE2ALFAWwAu0BeYDDwGRAMnJAAgALgEZKQOAAFwAUABUADIAHAAQAAigBgAGMANAA1AB5AEMARQAmABPACkAFUALAAXAAxABmADmAIQAQwAiABRgClAFiAMoAaIA74B9gH6ARgAjgBKQChgFXALmAbQA3AB6AEXgJEATYAnYBQ4CtgFigLYAXAAuQBdoC8wGGgMPAYwAyIBkgDJygAIAC4BIgAAA.YAAAAAAAAAAA",
      "acceptedVendors": [
          "5f1b2fbeb8e05c30686fd72a",
          "5eb32dea09c3f947e75e6f02",
          "5f1b2fbeb8e05c3057240fa0",
          "5f102879d9efe96bbebaf30b",
          "5e542b3a4cd8884eb41b5a76",
          "5f3bfd07a4724a6aaf5d7687",
          "5ec796b4320b5a4efd764e0f",
          "5e717c8e69966540e4554f05",
          "5f0f1187b8e05c109c2b8464",
          "5f3ee3dc8957bf8047ac94cc",
          "5e839a38b8e05c4e491e738e",
          "5f1b2fbeb8e05c3057240f6f",
          "5e7179e49a0b5040d5750812",
          "5e7f6927b8e05c111d01b40f",
          "5f3ee41ef16f426d9f757c24",
          "5e71760b69966540e4554f01",
          "5f1b2fbeb8e05c30686fd74c",
          "5f3ee4d4ed1f54674a088416",
          "5f3ee44399156268702167f3",
          "5f45507146d0607f71d2d2b6",
          "5ec462c02330505ab89fbb3b",
          "5e716fc09a0b5040d575080f",
          "5e7ac3fae30e7d1bc1ebf5e8",
          "5f4975d6c34a678c4f80dd99",
          "5f4fdc68ccd23307f4a3fe5f",
          "5f5a83b8702e05590c25d818",
          "5e7f6927b8e05c4e491e7380",
          "5efcaf4416696c0e08b30a4d",
          "5e542b3a4cd8884eb41b5a6c",
          "5f3bfd07a4724a6aaf5d7684",
          "5f3bfd07a4724a6aaf5d7685",
          "5e542b3a4cd8884eb41b5a75",
          "5f3bfd07a4724a6aaf5d7688",
          "5f3bfd07a4724a6aaf5d768a",
          "5f1b2fbdb8e05c30686fd6f3",
          "5ec7c9a9b8e05c4a1e720e76",
          "5f1b2fbeb8e05c306e139f31",
          "5f3ee3fa8fab7065b04bea42",
          "5f193bc8b8e05c3057240efb",
          "5e839a38b8e05c1c467daa7a",
          "5e945f26b8e05c6f984a3824",
          "5efb47d829507407f91c4d4e",
          "5f05be4cb8e05c109c2b83d2",
          "5f3bfd07a4724a6aaf5d768d",
          "602ee8b16f3b7a27de3581f9",
          "5f3bfd07a4724a6aaf5d768b",
          "5ed7a9a9e0e22001da9d52ad",
          "5ea172e36ede87504f7b4590",
          "5efb47c3a86ed40d775a6693",
          "5ecb8bccb8e05c4a0a513172",
          "5ee7add94c24944fdb5c5ac6",
          "5eab3d5ab8e05c1c467dab7a",
          "5e37fc3e56a5e6615457a526",
          "5eab3d5ab8e05c2bbe33f398",
          "5f369a02b8e05c2f2d546a41",
          "5e37fc3e56a5e6615502f9c3",
          "5e7ced57b8e05c485246ccd8",
          "5e7ced57b8e05c4854221bd0",
          "5e37fc3e56a5e66147767221",
          "5eb559cfb8e05c111d01b4e3",
          "5e98e7f0b8e05c1c467daaf1",
          "5ee15bc6b8e05c164c398ae3",
          "5e37fc3e56a5e6615502f9d2",
          "5f369a02b8e05c65ef01a824",
          "5e865b36b8e05c48537f60a7",
          "5eab3d5ab8e05c241a63c5dc",
          "5e37fc3e56a5e60dff4e1986",
          "5e98e7f0b8e05c48537f6111",
          "5e7ced56b8e05c4854221bb3",
          "5f1aada4b8e05c306c0597d5",
          "5e98e7f0b8e05c1c467daaf0",
          "5eb559d0b8e05c6f984a390b",
          "5e98e7f1b8e05c241a63c552",
          "5e7ced57b8e05c4854221bba",
          "5e7ced57b8e05c47d708158d",
          "5efefe25b8e05c109b4949ca",
          "5e7ced57b8e05c485246cce0",
          "5e37fc3e56a5e6615502f9c2",
          "5e37fc3e56a5e6615502f9c4",
          "5e7ced57b8e05c485246ccea",
          "5e7ced57b8e05c485246cce9",
          "5e37fc3e56a5e60e003a711f",
          "5e37fc3e56a5e60e003a711e",
          "5e865b37b8e05c1c467daa8c",
          "5e7ced57b8e05c5a7d171cda",
          "5eab3d5ab8e05c1c467dab79",
          "5e7ced57b8e05c485246cce5",
          "5e37fc3e56a5e60dff4e1994",
          "5eab3d5ab8e05c1c467dab7c",
          "5e7ced57b8e05c47e418b738",
          "5e7ced57b8e05c485246ccd9",
          "5ed6aeb1b8e05c241a63c71e",
          "5e37fc3e56a5e66147767223",
          "5eb559d0b8e05c48537f6208",
          "5eab3d5bb8e05c48537f61a0",
          "5e37fc3e56a5e60dff4e1981",
          "5f117325b8e05c0653789861",
          "5e37fc3e56a5e66147767237",
          "5e865b36b8e05c6f984a37e6",
          "5ee34ea5b8e05c164d21c78c",
          "5f2d22a6b8e05c02aa283b3b",
          "5e37fc3e56a5e6615457a532",
          "5e865b36b8e05c48537f60aa",
          "5eab3d5ab8e05c241a63c5db",
          "5efefe25b8e05c06542b2a77",
          "5e7ced57b8e05c485246cce2",
          "5e98e7f1b8e05c48537f6115",
          "5e37fc3e56a5e60e003a711d",
          "5e865b37b8e05c48537f60ae",
          "5eb559cfb8e05c111d01b4e5",
          "5efefe24b8e05c109b4949c8",
          "5eb559cfb8e05c2bbe33f3f5",
          "5e865b37b8e05c4e491e73a3",
          "5e37fc3e56a5e6615457a521",
          "5e37fc3e56a5e6615457a527",
          "5e37fc3e56a5e66147767232",
          "5e98e7f1b8e05c111d01b462",
          "5eec8924b8e05c69980ea9d3",
          "5e37fc3e56a5e6615502f9c5",
          "5e7ced57b8e05c4854221bbc",
          "5ed6aeb1b8e05c241a63c71f",
          "5eb559cfb8e05c2bbe33f3f3",
          "5e37fc3e56a5e66147767231",
          "5e37fc3e56a5e60e003a7111",
          "5ed6aeb2b8e05c4a06748dc9",
          "5f2d22a5b8e05c02ba124dc1",
          "5e865b37b8e05c6f984a37e8",
          "5e98e7f0b8e05c1c467daaf2",
          "5e7ced57b8e05c47e418b73c",
          "5f0838a5b8e05c109c2b8404",
          "5eab3d5ab8e05c1c467dab7b",
          "5e7ced57b8e05c485246ccef",
          "5e7ced57b8e05c47e418b73e",
          "5e865b36b8e05c6f984a37e7",
          "5e7ced57b8e05c4854221bc3",
          "5f23e824b8e05c2f262fe350",
          "5f23e824b8e05c2f285becd5",
          "5e37fc3e56a5e6615502f9c7",
          "5e37fc3e56a5e60e003a711b",
          "5e37fc3e56a5e60dff4e198c",
          "5e37fc3e56a5e66147767233",
          "5e7ced57b8e05c47d7081589",
          "5ee15bc7b8e05c16366599cb",
          "5eab3d5ab8e05c2bbe33f399",
          "5e37fc3e56a5e6615457a530",
          "5efefe24b8e05c2e742a3a16",
          "5e7ced57b8e05c4854221bcc",
          "5e865b37b8e05c1c467daa8e",
          "5e7ced57b8e05c4854221bb4",
          "5f2d22a6b8e05c02b03dbb65",
          "5e865b37b8e05c48537f60af",
          "5e865b36b8e05c48537f60a9",
          "5e7ced57b8e05c5a7d171cdc",
          "5f2d22a6b8e05c02ba124dc2",
          "5e7ced57b8e05c485246ccdf",
          "5e865b37b8e05c1c467daa8d",
          "5ed6aeb2b8e05c241a63c720",
          "5ee34ea4b8e05c16366599e8",
          "5e37fc3e56a5e6614776722a",
          "5ebee9f5b8e05c43d547d7cf",
          "5e7ced57b8e05c485246ccf0",
          "5ee15bc6b8e05c164d21c76b",
          "5f23e824b8e05c2f291f82e9",
          "5efefe25b8e05c0652669937",
          "5eec8924b8e05c69921d98d0",
          "5ee15bc7b8e05c164f6f8fee",
          "5e37fc3e56a5e6615457a529",
          "5e7ced57b8e05c485246ccde",
          "5eb559d0b8e05c2bbe33f3f6",
          "5e37fc3e56a5e60dff4e1983",
          "5eec8924b8e05c69921d98cf",
          "5e37fc3e56a5e60dff4e1984",
          "5eb559d0b8e05c2bbe33f3f7",
          "5e865b37b8e05c48537f60ac",
          "5f369a02b8e05c0fd672424a",
          "5e865b37b8e05c1c467daa8f",
          "5eab3d5ab8e05c241a63c5da",
          "5e37fc3e56a5e6615457a524",
          "5ed6aeb1b8e05c4a1e720f3b",
          "5ef5c3a4b8e05c69980eaa59",
          "5efefe25b8e05c109c2b8325",
          "5f369a02b8e05c0f7904cb76",
          "5e7ced57b8e05c47d7081590",
          "5e7ced57b8e05c4854221bb9",
          "5ef5c3a4b8e05c69980eaa58",
          "5e7ced57b8e05c47e418b73d",
          "5ee34ea4b8e05c164d21c78a",
          "5eb559cfb8e05c6f984a390a",
          "5e865b36b8e05c48537f60a8",
          "5e7ced57b8e05c47d7081588",
          "5e7ced57b8e05c4854221bbb",
          "5e98e7f1b8e05c241a63c550",
          "5e37fc3e56a5e6615457a522",
          "5ef5c3a4b8e05c699f3a0b81",
          "5e7ced57b8e05c4854221bbe",
          "5f1aada5b8e05c306e139f01",
          "5f2d22a6b8e05c02b03dbb67",
          "5e7ced57b8e05c485246cce1",
          "5e865b37b8e05c48537f60ab",
          "5e7ced57b8e05c4854221bc8",
          "5e37fc3e56a5e6614776722c",
          "5f369a02b8e05c0ee351e34f",
          "5f23e825b8e05c0ed30ea6ac",
          "5e37fc3e56a5e60e003a7122",
          "5ee34ea5b8e05c16366599e9",
          "5e865b37b8e05c48537f60ad",
          "5ebee9f5b8e05c6bd60edbeb",
          "5e98e7f1b8e05c48537f6113",
          "5e865b37b8e05c6f984a37ea",
          "5f1aada5b8e05c306c0597d6",
          "5e865b37b8e05c6f984a37e9",
          "5e7ced57b8e05c5a7d171cd6",
          "5f2d22a5b8e05c028e5c2e97",
          "5e37fc3e56a5e60e003a7113",
          "5e865b37b8e05c4e491e73a5",
          "5f117325b8e05c065164a42c",
          "5e865b37b8e05c6f984a37ec",
          "5f1aada6b8e05c30686fd6e1",
          "5e7ced57b8e05c47e418b74b",
          "5f0838a5b8e05c2e742a3aa7",
          "5e7ced57b8e05c4854221bbf",
          "5e7ced57b8e05c4854221bd7",
          "5e37fc3e56a5e6615457a533",
          "5eab3d5bb8e05c1c467dab7d",
          "5e98e7f0b8e05c241a63c54e",
          "5e7ced57b8e05c47e418b74f",
          "5ebee9f5b8e05c43d547d7d0",
          "5eb559d0b8e05c48537f6209",
          "5eab3d5bb8e05c2bbe33f39b",
          "5e37fc3e56a5e60e003a7115",
          "5f1aada4b8e05c306e139f00",
          "5eec8925b8e05c699f3a0af5",
          "5e37fc3e56a5e6615502f9ca",
          "5e7ced57b8e05c47e418b746",
          "5e37fc3e56a5e60dff4e1982",
          "5f2d22a6b8e05c02aa283b3e",
          "5e7ced57b8e05c4854221bb5",
          "5e7ced57b8e05c47e418b74c",
          "5e98e7f1b8e05c48537f6112",
          "5e7ced57b8e05c4854221bc7",
          "5f369a02b8e05c0f7904cb77",
          "5e37fc3e56a5e6615502f9c8",
          "5eec8924b8e05c69980ea9d2",
          "5eab3d5ab8e05c2bbe33f39a",
          "5e7ced57b8e05c485246ccda",
          "5efefe25b8e05c2e742a3a17",
          "5ee34ea4b8e05c16353f5bb7",
          "5e37fc3e56a5e60dff4e198f",
          "5e37fc3e56a5e6615457a523",
          "5ef5c3a5b8e05c699f3a0b83",
          "5e37fc3e56a5e60dff4e1995",
          "5e7ced57b8e05c47e418b743",
          "5e37fc3e56a5e60dff4e1992",
          "5ef5c3a5b8e05c69980eaa5b",
          "5e7ced57b8e05c4854221bb7",
          "5f23e826b8e05c7ed76148b3",
          "5ee34ea5b8e05c164d21c78b",
          "5efefe25b8e05c109c2b8324",
          "5ebee9f5b8e05c43d547d7d2",
          "5e7ced57b8e05c5a7d171cd5",
          "5f0838a5b8e05c06537897b1",
          "5e7ced57b8e05c4854221bb8",
          "5ed6aeb2b8e05c241a63c721",
          "5eb559d0b8e05c111d01b4e7",
          "5eec8924b8e05c699567f398",
          "5e865b37b8e05c1c467daa91",
          "5ed6aeb2b8e05c4a06748dcb",
          "5e37fc3e56a5e6615502f9c9",
          "5e7ced57b8e05c47d7081591",
          "5e37fc3e56a5e6615457a52e",
          "5e7ced57b8e05c4854221bd2",
          "5e7ced57b8e05c485246cce7",
          "5f1aada6b8e05c30686fd6e0",
          "5f2d22a6b8e05c02b355d543",
          "5e7ced57b8e05c4854221bc4",
          "5e98e7f1b8e05c241a63c551",
          "5e37fc3e56a5e6615502f9cc",
          "5ef5c3a5b8e05c699f3a0b84",
          "5e37fc3e56a5e66147767230",
          "5f117326b8e05c065164a42d",
          "5e37fc3e56a5e6614776722d",
          "5e37fc3e56a5e6614776722e",
          "5f1aada6b8e05c306d724976",
          "5e98e7f1b8e05c241a63c54f",
          "5e7ced57b8e05c485246cce8",
          "5f1aada5b8e05c306d724975",
          "5e37fc3e56a5e60e003a7114",
          "5ef5c3a5b8e05c69980eaa5a",
          "5e7ced57b8e05c47e418b745",
          "5e37fc3e56a5e60e003a7116",
          "5f369a02b8e05c2f2d546a42",
          "5e37fc3e56a5e60dff4e1989",
          "5e37fc3e56a5e6615457a52b",
          "5eb559cfb8e05c111d01b4e4",
          "5e7ced57b8e05c47e418b749",
          "5f0838a5b8e05c06542b2b37",
          "5f369a02b8e05c0fc521e7b8",
          "5e37fc3e56a5e6615457a528",
          "5e37fc3e56a5e6615457a52c",
          "5eb559d0b8e05c6f984a390c",
          "5ee15bc7b8e05c164c398ae4",
          "5e7ced57b8e05c5a7d171cd3",
          "5eb559d0b8e05c48537f6207",
          "5e7ced57b8e05c485246ccd7",
          "5e7ced57b8e05c5a7d171cd9",
          "5e7ced57b8e05c4854221bd5",
          "5e865b37b8e05c1c467daa93",
          "5e7ced57b8e05c47e418b741",
          "5e7ced57b8e05c5a7d171cdd",
          "5e7ced57b8e05c47e418b73a",
          "5e7ced57b8e05c5a7d171cdb",
          "5e7ced57b8e05c485246ccf1",
          "5e7ced57b8e05c47d708158f",
          "5e37fc3e56a5e6615457a525",
          "5e7ced57b8e05c47e418b742",
          "5e98e7f1b8e05c1c467daaf4",
          "5ee34ea5b8e05c164f6f8ffe",
          "5f117326b8e05c065164a42e",
          "5f369a02b8e05c307d07e422",
          "5e37fc3e56a5e66147767227",
          "5ed6aeb2b8e05c4a1160fe91",
          "5e98e7f1b8e05c241a63c553",
          "5eab3d5bb8e05c48537f61a1",
          "5e7ced57b8e05c485246ccdc",
          "5e37fc3e56a5e60dff4e1988",
          "5ebee9f5b8e05c2bbe33f490",
          "5ed6aeb2b8e05c4a1e720f3d",
          "5e7ced57b8e05c4854221bc2",
          "5e7ced57b8e05c4854221bd6",
          "5e37fc3e56a5e66147767228",
          "5e7ced57b8e05c4854221bd8",
          "5e865b37b8e05c4e491e73a6",
          "5eab3d5bb8e05c241a63c5df",
          "5e7ced57b8e05c47d708158c",
          "5e7ced57b8e05c485246cce6",
          "5f117326b8e05c4ca16c9c78",
          "5f1aada5b8e05c3057240f2c",
          "5e37fc3e56a5e60e003a7112",
          "5ebee9f5b8e05c2bbe33f491",
          "5ee15bc7b8e05c164f6f8fef",
          "5f0838a5b8e05c06537897af",
          "5e7ced57b8e05c47d708158a",
          "5eab3d5bb8e05c1c467dab7e",
          "5ed6aeb2b8e05c4a1160fe92",
          "5e37fc3e56a5e60dff4e1993",
          "5e7ced57b8e05c4854221bc6",
          "5e7ced57b8e05c47e418b73f",
          "5e37fc3e56a5e6615502f9d3",
          "5eb559d0b8e05c241a63c64a",
          "5e37fc3e56a5e60e003a7125",
          "5e37fc3e56a5e60dff4e198a",
          "5e7ced57b8e05c47e418b74d",
          "5e7ced57b8e05c485246cced",
          "5e865b37b8e05c48537f60b1",
          "5eab3d5bb8e05c241a63c5dd",
          "5e7ced57b8e05c5a7d171cde",
          "5f23e825b8e05c2f291f82ea",
          "5e7ced57b8e05c47e418b744",
          "5e37fc3e56a5e6615457a52d",
          "5e865b37b8e05c48537f60b0",
          "5e37fc3e56a5e66147767225",
          "5ee15bc7b8e05c16353f5b9b",
          "5e37fc3e56a5e6615457a52a",
          "5e37fc3e56a5e60e003a711c",
          "5e37fc3e56a5e66147767222",
          "5e37fc3e56a5e6615502f9ce",
          "5e37fc3e56a5e60e003a7119",
          "5e37fc3e56a5e6615502f9cd",
          "5e37fc3e56a5e6615502f9d5",
          "5e37fc3e56a5e6615502f9cb",
          "5e7ced57b8e05c4854221bca",
          "5e37fc3e56a5e60dff4e1985",
          "5e37fc3e56a5e66147767234",
          "5e7ced57b8e05c47e418b74a",
          "5e37fc3e56a5e6615502f9c6",
          "5e37fc3e56a5e6615502f9d6",
          "5e37fc3e56a5e6615457a531",
          "5e7ced57b8e05c47e418b748",
          "5e37fc3e56a5e60dff4e1996",
          "5e7ced57b8e05c485246ccdb",
          "5e37fc3e56a5e60e003a7117",
          "5e7ced57b8e05c485246cce3",
          "5eab3d5bb8e05c2bbe33f39d",
          "5e37fc3e56a5e66147767238",
          "5efefe25b8e05c065164a2e2",
          "5e7ced57b8e05c5a7d171cd4",
          "5f369a02b8e05c30583590fb",
          "5e7ced57b8e05c47e418b747",
          "5e7ced57b8e05c5a7d171cd7",
          "5e7ced57b8e05c4854221bbd",
          "5f1aada6b8e05c306e139f02",
          "5e7ced57b8e05c47e418b750",
          "5e7ced57b8e05c485246ccf4",
          "5e7ced57b8e05c485246cceb",
          "5e7ced57b8e05c4854221bc1",
          "5e7ced57b8e05c47e418b740",
          "5e7ced57b8e05c4854221bcf",
          "5e7ced57b8e05c4854221bd3",
          "5ed6aeb2b8e05c4a2002f43b",
          "5e865b37b8e05c6f984a37ee",
          "5e98e7f1b8e05c48537f6116",
          "5e98e7f1b8e05c1c467daaf3",
          "5f1aada6b8e05c306c0597d7",
          "5eab3d5bb8e05c241a63c5de",
          "5eab3d5bb8e05c2bbe33f39c",
          "5eb559d0b8e05c1c467dabea",
          "5ed6aeb2b8e05c4a06748dcc",
          "5ed6aeb2b8e05c4a1160fe93",
          "5f23e826b8e05c0c0d4fdb8e",
          "5ee15bc7b8e05c164f6f8ff0",
          "5ee15bc7b8e05c16366599cc",
          "5ee15bc7b8e05c16366599cd",
          "5ee34ea5b8e05c16353f5bb8",
          "5ef5c3a5b8e05c699f3a0b85",
          "5ef5c3a5b8e05c699f3a0b82",
          "5efefe25b8e05c06542b2a79",
          "5efefe25b8e05c06542b2a78",
          "5efefe25b8e05c2e742a3a18",
          "5efefe25b8e05c0652669938",
          "5f0838a5b8e05c109c2b8405",
          "5f0838a5b8e05c065164a385",
          "5f0838a5b8e05c065164a383",
          "5f0838a5b8e05c06542b2b38",
          "5f0838a5b8e05c065164a384",
          "5f369a02b8e05c0ee351e351",
          "5f117326b8e05c109c2b84d1",
          "5f117326b8e05c0652669a8a",
          "5f1aada6b8e05c306c0597d8",
          "5f23e826b8e05c0c0d4fdb8c",
          "5f369a02b8e05c308701f829",
          "5f23e825b8e05c0ed30ea6ae",
          "5f2d22a6b8e05c02b03dbb66",
          "5f2d22a6b8e05c028e5c2e98",
          "5f2d22a6b8e05c02b03dbb68",
          "5f2d22a6b8e05c02901c9122",
          "5f2d22a6b8e05c02aa283b3c",
          "5f2d22a6b8e05c02ba124dc3",
          "5f369a02b8e05c02b4333299",
          "5f369a02b8e05c65ef01a826",
          "5f369a02b8e05c41e84c2070"
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
          },
          "5e37fc3e56a5e6615502f9c4": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ed6aeb2b8e05c4a1160fe91": {
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
          },
          "5e7ced56b8e05c4854221bb3": {
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
          },
          "5eab3d5ab8e05c241a63c5db": {
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
          },
          "5f1b2fbeb8e05c30686fd72a": {
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
          },
          "5eb32dea09c3f947e75e6f02": {
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
          },
          "5f1b2fbeb8e05c3057240fa0": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f369a02b8e05c2f2d546a42": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f369a02b8e05c65ef01a824": {
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
          },
          "5e37fc3e56a5e60dff4e1995": {
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
                  "5f31cdf48fe52a6a6313f0a9": true
              }
          },
          "5e37fc3e56a5e60dff4e1992": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e60dff4e1994": {
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
          "5f369a02b8e05c0ee351e34f": {
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
          },
          "5f369a02b8e05c2f2d546a41": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f369a02b8e05c30583590fb": {
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
          },
          "5e7ced57b8e05c47e418b73c": {
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
          },
          "5e37fc3e56a5e60dff4e1982": {
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
          },
          "5f369a02b8e05c0f7904cb76": {
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
          },
          "5f369a02b8e05c307d07e422": {
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
          },
          "5e37fc3e56a5e6615457a522": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f369a02b8e05c0fd672424a": {
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
          },
          "5e37fc3e56a5e6615502f9c9": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c485246cce1": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e60e003a711b": {
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
          },
          "5f369a02b8e05c41e84c2070": {
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
          },
          "5e37fc3e56a5e6614776722a": {
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
          "5e7ced57b8e05c47d7081589": {
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
          "5e7ced57b8e05c47d7081591": {
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
          },
          "5e37fc3e56a5e6615457a52d": {
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
          },
          "5e37fc3e56a5e6614776722c": {
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
          },
          "5e7ced57b8e05c4854221bbb": {
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
          },
          "5e865b37b8e05c48537f60ad": {
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
                  "5f31cdf48fe52a6a6313f0a9": true
              }
          },
          "5e865b37b8e05c6f984a37ee": {
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
          },
          "5e7ced57b8e05c47e418b74a": {
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
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c4854221bd6": {
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
          },
          "5e37fc3e56a5e6614776722d": {
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
          },
          "5e37fc3e56a5e60dff4e1985": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c4854221bbc": {
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
          },
          "5e7ced57b8e05c5a7d171cde": {
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
          },
          "5e37fc3e56a5e60e003a7125": {
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
          },
          "5e7ced57b8e05c4854221bc1": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e6615457a52a": {
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
          },
          "5e7ced57b8e05c4854221bd8": {
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
          },
          "5e37fc3e56a5e6615502f9c3": {
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
          },
          "5e865b37b8e05c1c467daa91": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c47d708158a": {
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
          },
          "5e865b37b8e05c1c467daa8c": {
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
          },
          "5e7ced57b8e05c4854221bb9": {
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
          },
          "5e865b37b8e05c48537f60af": {
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
          },
          "5e865b37b8e05c1c467daa8d": {
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
          },
          "5e7ced57b8e05c485246cce7": {
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
          },
          "5e37fc3e56a5e60dff4e1989": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e60e003a711c": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e6615457a52c": {
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
          },
          "5e7ced57b8e05c4854221bc4": {
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
          },
          "5e7ced57b8e05c485246ccdb": {
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
          },
          "5e98e7f1b8e05c48537f6113": {
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
          },
          "5e7ced57b8e05c47e418b748": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c47e418b73f": {
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
          },
          "5e37fc3e56a5e6615502f9ce": {
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
                  "5f31cdf48fe52a6a6313f0a9": true
              }
          },
          "5e37fc3e56a5e66147767233": {
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
          },
          "5e37fc3e56a5e60dff4e1993": {
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
          },
          "5e37fc3e56a5e66147767228": {
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
          },
          "5e98e7f1b8e05c241a63c54f": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c485246ccf1": {
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
                  "5f31cdf48fe52a6a6313f0a9": true
              }
          },
          "5e865b37b8e05c4e491e73a6": {
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
          },
          "5e98e7f1b8e05c48537f6112": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e865b37b8e05c6f984a37ec": {
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
          },
          "5e37fc3e56a5e60dff4e1988": {
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
          },
          "5e37fc3e56a5e66147767234": {
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
          },
          "5e37fc3e56a5e60dff4e1981": {
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
          },
          "5e865b36b8e05c48537f60a9": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5eb559d0b8e05c1c467dabea": {
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
          },
          "5e7ced57b8e05c47e418b740": {
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
          },
          "5eab3d5bb8e05c2bbe33f39b": {
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
          },
          "5e37fc3e56a5e6615502f9d6": {
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
          },
          "5eb559cfb8e05c2bbe33f3f3": {
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
          },
          "5eab3d5bb8e05c48537f61a0": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e60e003a7116": {
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
          },
          "5e7ced57b8e05c4854221bb8": {
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
          },
          "5e37fc3e56a5e66147767227": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c47e418b741": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c485246ccd7": {
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
          "5eb559d0b8e05c2bbe33f3f7": {
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
          },
          "5eb559cfb8e05c6f984a390a": {
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
          },
          "5e7ced57b8e05c4854221bd5": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5eb559d0b8e05c241a63c64a": {
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
          },
          "5eb559cfb8e05c111d01b4e5": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true
              }
          },
          "5e7ced57b8e05c485246cce6": {
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
          },
          "5e98e7f1b8e05c241a63c550": {
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
          "5e7ced57b8e05c485246ccdf": {
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
          },
          "5e7ced57b8e05c4854221bb7": {
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
          },
          "5e7ced57b8e05c485246cce3": {
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
          },
          "5eab3d5bb8e05c241a63c5df": {
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
          },
          "5ebee9f5b8e05c2bbe33f490": {
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
          },
          "5e7ced57b8e05c4854221bd7": {
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
                  "5f31cdf48fe52a6a6313f0a9": true
              }
          },
          "5eec8924b8e05c699567f398": {
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
          },
          "5eec8924b8e05c69980ea9d3": {
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
          },
          "5eab3d5bb8e05c48537f61a1": {
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
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c4854221bd3": {
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
          },
          "5eec8925b8e05c699f3a0af5": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ef5c3a5b8e05c699f3a0b84": {
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
          },
          "5ef5c3a5b8e05c699f3a0b83": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5efefe25b8e05c06542b2a78": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true
              }
          },
          "5efefe25b8e05c109b4949ca": {
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
          },
          "5efefe25b8e05c2e742a3a17": {
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
          },
          "5efefe25b8e05c109c2b8324": {
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
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e60dff4e198f": {
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
          },
          "5f0838a5b8e05c065164a385": {
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
          },
          "5f0838a5b8e05c109c2b8405": {
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
          },
          "5eec8924b8e05c69921d98cf": {
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
          },
          "5e98e7f0b8e05c241a63c54e": {
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
          },
          "5f117326b8e05c0652669a8a": {
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
          },
          "5e37fc3e56a5e6615457a523": {
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
          },
          "5f0838a5b8e05c06537897b1": {
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
          },
          "5f117326b8e05c4ca16c9c78": {
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
          },
          "5eab3d5bb8e05c2bbe33f39d": {
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
          },
          "5f1aada6b8e05c306e139f02": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c485246cce8": {
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
          },
          "5efefe25b8e05c0652669937": {
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
          },
          "5e98e7f0b8e05c48537f6111": {
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
          "5e865b37b8e05c6f984a37e9": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ee15bc7b8e05c164f6f8fef": {
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
          },
          "5ee15bc7b8e05c16366599cd": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e66147767222": {
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
                  "5f31cdf48fe52a6a6313f0a9": true
              }
          },
          "5e37fc3e56a5e60dff4e198c": {
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
          },
          "5f1aada5b8e05c306d724975": {
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
          },
          "5ed6aeb2b8e05c4a2002f43b": {
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
          },
          "5f117326b8e05c109c2b84d1": {
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
          },
          "5ee34ea4b8e05c164d21c78a": {
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
          },
          "5e7ced57b8e05c485246ccde": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f117325b8e05c0653789861": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e66147767231": {
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
          },
          "5f23e826b8e05c7ed76148b3": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true
              }
          },
          "5f23e825b8e05c0ed30ea6ae": {
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
          },
          "5f2d22a6b8e05c02b03dbb67": {
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
          },
          "5f2d22a5b8e05c02ba124dc1": {
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
          },
          "5f2d22a6b8e05c02ba124dc3": {
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
          },
          "5f2d22a6b8e05c02aa283b3e": {
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
          },
          "5f2d22a6b8e05c02b03dbb68": {
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
          },
          "5f2d22a6b8e05c02b03dbb66": {
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
          },
          "5e7ced57b8e05c47e418b749": {
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
          },
          "5e7ced57b8e05c485246ccea": {
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
          },
          "5eab3d5bb8e05c241a63c5dd": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f102879d9efe96bbebaf30b": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e542b3a4cd8884eb41b5a76": {
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
          },
          "5f3bfd07a4724a6aaf5d7687": {
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
          },
          "5ec796b4320b5a4efd764e0f": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e717c8e69966540e4554f05": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f0f1187b8e05c109c2b8464": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f3ee3dc8957bf8047ac94cc": {
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
          },
          "5e839a38b8e05c4e491e738e": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f1b2fbeb8e05c3057240f6f": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7179e49a0b5040d5750812": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7f6927b8e05c111d01b40f": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f3ee41ef16f426d9f757c24": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e71760b69966540e4554f01": {
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
          },
          "5f1b2fbeb8e05c30686fd74c": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f3ee4d4ed1f54674a088416": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f3ee44399156268702167f3": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f45507146d0607f71d2d2b6": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ec462c02330505ab89fbb3b": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e716fc09a0b5040d575080f": {
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
          },
          "5e7ac3fae30e7d1bc1ebf5e8": {
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
          },
          "5f4975d6c34a678c4f80dd99": {
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
          },
          "5f4fdc68ccd23307f4a3fe5f": {
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
                  "5f31cdf48fe52a6a6313eff6": true,
                  "5f3dadcd3e83a81e92e70f55": true
              }
          },
          "5f5a83b8702e05590c25d818": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c5a7d171cd4": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true
              }
          },
          "5e37fc3e56a5e6615502f9c8": {
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
          },
          "5e7ced57b8e05c4854221bc6": {
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
          "5ebee9f5b8e05c6bd60edbeb": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7f6927b8e05c4e491e7380": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c4854221bcf": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f061": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c4854221bd0": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c47e418b738": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e66147767237": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e98e7f1b8e05c111d01b462": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e66147767223": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5eb559d0b8e05c48537f6208": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c485246cce0": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c485246ccef": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5eab3d5ab8e05c2bbe33f399": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5efcaf4416696c0e08b30a4d": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f2d22a6b8e05c02aa283b3b": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e60e003a711e": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c4854221bba": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f369a02b8e05c02b4333299": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f369a02b8e05c0f7904cb77": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e6615502f9c2": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e6615457a526": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e60e003a711f": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f369a02b8e05c308701f829": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e6615457a52e": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f06c": true
              }
          },
          "5e37fc3e56a5e60e003a7113": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c5a7d171cdc": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c5a7d171cda": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e6615457a528": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c5a7d171cd9": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e66147767221": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e60dff4e1986": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e60e003a7115": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c485246cce9": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c4854221bc2": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c485246ccda": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true
              }
          },
          "5ed6aeb2b8e05c241a63c720": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e865b36b8e05c48537f60a7": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e6615502f9cc": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c4854221bbf": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e865b37b8e05c6f984a37e8": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c47e418b743": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e865b37b8e05c6f984a37ea": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c485246cced": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e865b37b8e05c1c467daa8f": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e6615457a531": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e60e003a711d": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e98e7f0b8e05c1c467daaf1": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c47e418b74c": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c47e418b73a": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c4854221bd2": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c485246ccf0": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e60e003a7119": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c47e418b747": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e98e7f1b8e05c1c467daaf3": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c47e418b746": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e66147767230": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true
              }
          },
          "5e37fc3e56a5e6615502f9cb": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c5a7d171cd5": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true
              }
          },
          "5e865b37b8e05c48537f60ab": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c47e418b73e": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e865b36b8e05c6f984a37e7": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e865b37b8e05c1c467daa8e": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c47e418b745": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c47e418b744": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true
              }
          },
          "5eab3d5bb8e05c241a63c5de": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c485246ccf4": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e98e7f0b8e05c1c467daaf2": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e6615457a524": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5eb559d0b8e05c6f984a390c": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5eb559d0b8e05c6f984a390b": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e98e7f1b8e05c1c467daaf4": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c4854221bb4": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5eb559d0b8e05c48537f6209": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5eab3d5ab8e05c1c467dab7b": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c5a7d171cd3": {
              "vendorGrant": true,
              "purposeGrants": {
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
          "5e98e7f1b8e05c241a63c551": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e6615502f9ca": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e865b37b8e05c4e491e73a5": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5eb559d0b8e05c2bbe33f3f6": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e98e7f1b8e05c241a63c552": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c4854221bb5": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c47e418b74d": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c4854221bca": {
              "vendorGrant": true,
              "purposeGrants": {
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
          },
          "5e7ced57b8e05c47e418b742": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e66147767232": {
              "vendorGrant": true,
              "purposeGrants": {
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
          "5e37fc3e56a5e6615502f9d2": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5eab3d5ab8e05c1c467dab79": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5eb559d0b8e05c48537f6207": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ed6aeb2b8e05c4a06748dcb": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ebee9f5b8e05c43d547d7d0": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c485246ccdc": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c485246cce2": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e865b37b8e05c48537f60b1": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ebee9f5b8e05c2bbe33f491": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ee15bc6b8e05c164c398ae3": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ed6aeb2b8e05c4a06748dc9": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ee15bc6b8e05c164d21c76b": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ed6aeb2b8e05c4a1160fe92": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c4854221bc8": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ed6aeb1b8e05c241a63c71e": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ee15bc7b8e05c164f6f8ff0": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ee34ea5b8e05c164d21c78c": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ebee9f5b8e05c43d547d7cf": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5eab3d5ab8e05c2bbe33f39a": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e865b37b8e05c48537f60ac": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ef5c3a4b8e05c699f3a0b81": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ee15bc7b8e05c164f6f8fee": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ef5c3a4b8e05c69980eaa58": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5efefe25b8e05c06542b2a79": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5efefe24b8e05c2e742a3a16": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5efefe25b8e05c109c2b8325": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e6615457a532": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f0838a5b8e05c06537897af": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5eab3d5ab8e05c1c467dab7a": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f117325b8e05c065164a42c": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f1aada4b8e05c306c0597d5": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f1aada5b8e05c306c0597d6": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f0838a5b8e05c2e742a3aa7": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f1aada5b8e05c306e139f01": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f1aada4b8e05c306e139f00": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f1aada6b8e05c30686fd6e0": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e865b37b8e05c48537f60ae": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e865b36b8e05c48537f60aa": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e60e003a7111": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ed6aeb1b8e05c4a1e720f3b": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e98e7f1b8e05c48537f6115": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f23e824b8e05c2f291f82e9": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5eec8924b8e05c69921d98d0": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ee34ea4b8e05c16353f5bb7": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ef5c3a4b8e05c69980eaa59": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5eb559cfb8e05c2bbe33f3f5": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5eab3d5ab8e05c2bbe33f398": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f117326b8e05c065164a42d": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ee34ea5b8e05c164d21c78b": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f23e825b8e05c0ed30ea6ac": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e6615457a521": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f23e824b8e05c2f285becd5": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ee15bc7b8e05c16353f5b9b": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f23e826b8e05c0c0d4fdb8e": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e865b37b8e05c4e491e73a3": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f23e824b8e05c2f262fe350": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c4854221bbe": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true
              }
          },
          "5f2d22a6b8e05c02b03dbb65": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f2d22a6b8e05c02b355d543": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f2d22a5b8e05c028e5c2e97": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f2d22a6b8e05c028e5c2e98": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ee34ea5b8e05c16366599e9": {
              "vendorGrant": true,
              "purposeGrants": {
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
          },
          "5f2d22a6b8e05c02aa283b3c": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e542b3a4cd8884eb41b5a6c": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f3bfd07a4724a6aaf5d7684": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f3bfd07a4724a6aaf5d7685": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e542b3a4cd8884eb41b5a75": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f3bfd07a4724a6aaf5d7688": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true
              }
          },
          "5f3bfd07a4724a6aaf5d768a": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f1b2fbdb8e05c30686fd6f3": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ec7c9a9b8e05c4a1e720e76": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f1b2fbeb8e05c306e139f31": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f3ee3fa8fab7065b04bea42": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true
              }
          },
          "5f193bc8b8e05c3057240efb": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e839a38b8e05c1c467daa7a": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5eab3d5ab8e05c1c467dab7c": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c47e418b74b": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c5a7d171cd6": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f369a02b8e05c65ef01a826": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c47e418b73d": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e945f26b8e05c6f984a3824": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5efefe25b8e05c0652669938": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5eab3d5ab8e05c241a63c5da": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f03f": true,
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f23e825b8e05c2f291f82ea": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c485246ccd8": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c485246cce5": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f2d22a6b8e05c02ba124dc2": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5eb559cfb8e05c111d01b4e3": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5efb47d829507407f91c4d4e": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f05be4cb8e05c109c2b83d2": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e6615502f9c7": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true
              }
          },
          "5f369a02b8e05c0fc521e7b8": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true
              }
          },
          "5e7ced57b8e05c4854221bcc": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e865b37b8e05c48537f60b0": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true
              }
          },
          "5e7ced57b8e05c4854221bc7": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e6615502f9cd": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c47e418b737": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true
              }
          },
          "5e865b36b8e05c48537f60a8": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5eab3d5bb8e05c1c467dab7d": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e98e7f1b8e05c48537f6116": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true
              }
          },
          "5e7ced57b8e05c47e418b750": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ed6aeb2b8e05c241a63c721": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ed6aeb2b8e05c4a1e720f3d": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ed6aeb2b8e05c4a1160fe93": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ef5c3a5b8e05c69980eaa5a": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ef5c3a5b8e05c699f3a0b85": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ef5c3a5b8e05c699f3a0b82": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f012": true
              }
          },
          "5f0838a5b8e05c065164a383": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f1aada6b8e05c306c0597d8": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c47d708158c": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c485246ccd9": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f012": true
              }
          },
          "5e98e7f0b8e05c1c467daaf0": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e60e003a7122": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f23e826b8e05c0c0d4fdb90": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f012": true
              }
          },
          "5f2d22a6b8e05c02901c9122": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f3bfd07a4724a6aaf5d768d": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5eb559d0b8e05c111d01b4e7": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e865b36b8e05c6f984a37e6": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "602ee8b16f3b7a27de3581f9": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f012": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ef5c3a5b8e05c69980eaa5b": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e6615457a530": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e6615457a529": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e6615457a525": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ed6aeb1b8e05c241a63c71f": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ed6aeb2b8e05c4a06748dcc": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ebee9f5b8e05c43d547d7d2": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5efefe24b8e05c109b4949c8": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c47d708158d": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f1aada6b8e05c306d724976": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f23e826b8e05c0c0d4fdb8c": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c4854221bc3": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f02b": true,
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f3bfd07a4724a6aaf5d768b": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f053": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e865b37b8e05c1c467daa90": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f3dadcd3e83a81e92e70f55": true
              }
          },
          "5efefe25b8e05c06542b2a77": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ed7a9a9e0e22001da9d52ad": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ea172e36ede87504f7b4590": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e6615457a52b": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true
              }
          },
          "5e37fc3e56a5e60dff4e1996": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e66147767238": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true
              }
          },
          "5e37fc3e56a5e6615502f9d5": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f369a02b8e05c307d07e421": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f0a9": true
              }
          },
          "5e7ced57b8e05c4854221bc9": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true
              }
          },
          "5e37fc3e56a5e6615502f9c5": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e60e003a7112": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e6615457a533": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c5a7d171cdd": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true
              }
          },
          "5e37fc3e56a5e6615502f9d3": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true
              }
          },
          "5e37fc3e56a5e6615502f9c6": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c485246ccf3": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true
              }
          },
          "5e37fc3e56a5e60dff4e1984": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e6614776722e": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e865b37b8e05c1c467daa93": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c47d708158f": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e60dff4e198a": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c4854221bbd": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e98e7f1b8e05c241a63c553": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c47d7081588": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5eb559cfb8e05c111d01b4e4": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c485246cceb": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true
              }
          },
          "5e7ced57b8e05c5a7d171cd7": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c5a7d171cdb": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ee34ea4b8e05c16366599e8": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ee15bc6b8e05c16353f5b99": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true
              }
          },
          "5ee34ea5b8e05c16353f5bb8": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5eec8924b8e05c69980ea9d2": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f0838a5b8e05c065164a384": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true
              }
          },
          "5f117326b8e05c065164a42e": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f0838a5b8e05c06542b2b37": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5eab3d5ab8e05c241a63c5dc": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f0838a5b8e05c109c2b8404": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ee15bc7b8e05c164c398ae4": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ed6aeb2b8e05c4a1e720f3c": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f0a9": true
              }
          },
          "5efefe25b8e05c2e742a3a18": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5efb47c3a86ed40d775a6693": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e542b3a4cd8884eb41b5a72": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f3dadcd3e83a81e92e70f55": true
              }
          },
          "5f0838a5b8e05c06542b2b38": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f369a02b8e05c0ee351e351": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c47d7081587": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true
              }
          },
          "5eab3d5bb8e05c2bbe33f39c": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f06c": true,
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5efefe25b8e05c065164a2e2": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f087": true
              }
          },
          "5ee15bc7b8e05c16366599cc": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ecb8bccb8e05c4a0a513172": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ee7add94c24944fdb5c5ac6": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f087": true,
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e60dff4e1983": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e66147767225": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e60e003a7117": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f1aada5b8e05c3057240f2c": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f097": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5eab3d5bb8e05c1c467dab7e": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f097": true
              }
          },
          "5ee34ea5b8e05c164f6f8ffe": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313f0a9": true,
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e6615457a527": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e7ced57b8e05c47e418b74f": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5e37fc3e56a5e60e003a7114": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5f1aada6b8e05c30686fd6e1": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5ee15bc7b8e05c16366599cb": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f31cdf48fe52a6a6313eff6": true
              }
          },
          "5edf9859cc38b958ec9fd2ad": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f3dadcd3e83a81e92e70f55": true
              }
          },
          "5f3bfd07a4724a6aaf5d7683": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f3dadcd3e83a81e92e70f55": true
              }
          },
          "5f3bfd07a4724a6aaf5d7686": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f3dadcd3e83a81e92e70f55": true
              }
          },
          "5f3bfd07a4724a6aaf5d768c": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f3dadcd3e83a81e92e70f55": true
              }
          },
          "5e839a38b8e05c48537f609c": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f3dadcd3e83a81e92e70f55": true
              }
          },
          "5e820130b8e05c54a85c52f5": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f3dadcd3e83a81e92e70f55": true
              }
          },
          "5f1b2fbeb8e05c30686fd76c": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f3dadcd3e83a81e92e70f55": true
              }
          },
          "5f0f4c159c10086dcb614c6a": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f3dadcd3e83a81e92e70f55": true
              }
          },
          "5ea2d4894e5aa15059fde8a0": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f3dadcd3e83a81e92e70f55": true
              }
          },
          "5f0f4b6a5c74fb6dec6cbd14": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f3dadcd3e83a81e92e70f55": true
              }
          },
          "5f5922c2b1f8054972146ccc": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f3dadcd3e83a81e92e70f55": true
              }
          },
          "5fa0763dd2d07d52ceb6838c": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f3dadcd3e83a81e92e70f55": true
              }
          },
          "5f0f3855bb50d16d300d30fa": {
              "vendorGrant": true,
              "purposeGrants": {
                  "5f3dadcd3e83a81e92e70f55": true
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
        type: 'ccpa',
        applies: true,
        message: renderingAppMessageCCPA,
        messageMetaData,
        userConsent: {
          rejectedCategories: ['abc'],
          rejectedVendors: ['abc'],
          rejectedAll: false,
          status: 'rejectedSoome',
          USPString: 'abc',
        }
      },
      {
        type: 'gdpr',
        applies: true,
        message: renderingAppMessageGDPR,
        messageMetaData,
        userConsent: {
          euconsent: 'abc',
          grants: {},
          TCData: {
            foo: "bar"
          }
        }
      }, 
      {
        type: 'ios14',
        message: renderingAppMessage,
        messageMetaData
      }
    ],
    localState: '{ \"data\": \"local state data\" }'
  })
})

router.post('/wrapper', async (_req, res) => {
  res.status(200).json(
    {
      porco:"dio"
    }
  )
})

module.exports = router