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

router.post('/multi-campaign', async (_req, res) => {
  res.status(200).json({
    campaigns: [
      {
        type: 'ccpa',
        applies: true,
        message: renderingAppMessage,
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
        message: renderingAppMessage,
        messageMetaData,
        userConsent: {
          euconsent: 'abc',
          grants: {},
          TCData: {}
        }
      }, 
      {
        type: 'ios14',
        message: renderingAppMessage,
        messageMetaData,
        messageMetaData: {
          messageId: 123
        }
      }
    ],
    localState: '{ \"data\": \"local state data\" }'
  })
})

module.exports = router