let selectedVacancyId = null;
let cachedHTML = null;
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    let authToken;
    let globalContacts = null;
    console.log(message);
    if (message.action === 'saveCandidate') {
        globalContacts = message.contacts; // Сохраняем контакты
        getAuthToken()
            .then(token => {
                authToken = token;
                console.log(message);
                return checkCandidate(message.lastName, authToken); // проверяем существует ли кандидат
            })
            .then(candidateId => {
                console.log(message.candidateId);
                return saveCandidate(authToken, message.firstName, message.lastName, globalContacts, message.allInfo, message.foto, message.rezume, message.cvComb, message.candidateId);
            })
            .then(candidate => {
                if (!candidate || !candidate.id) {
                    throw new Error('Candidate object is undefined or does not have an id');
                }
                // Make a request to save the position
                return fetch(`https://crm.ollsent.tech/wp-json/acf/v3/candidate/${candidate.id}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8',
                        'Authorization': 'Bearer ' + authToken
                    },
                    body: JSON.stringify({
                        fields: {
                            spec1: message.positionId,
                            posada_inshi: message.positionNoitId,
                            zarplata: message.zarplata,
                            mova_p: message.mova,
                            city_r: message.city,
                            id_vac: message.vacid,
                            candidate_stage: message.candidate_st,
                            tegi: message.tag,
                            engl_r: message.engl,
                            exp_r: message.exp,
                            additional_info_cp: message.adinf
                        }
                    })
                });
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to save the position');
                }
                console.log('Candidate and position saved successfully');
                sendResponse({action: 'saveCandidateResult', success: true});
            })
            .catch(error => {
                console.error('Error when saving candidate:', error);
                sendResponse({action: 'saveCandidateResult', success: false});
            });
        return true; // keeps the message channel open until sendResponse is executed
    }
    else if (message.action === 'checkCandidate') {
        getAuthToken()
            .then(authToken => {
                return checkCandidate(message.lastName, authToken);
            }) // Используем lastName для поиска
            .then(candidateExists => {
                sendResponse({action: 'checkCandidateResult', exists: candidateExists});
            })
            .catch(error => {
                console.error('Ошибка при проверке кандидата:', error);
                sendResponse({action: 'checkCandidateResult', exists: false});
            });
    }
    else if (message.action === 'fetchLanguages') {
        getAuthToken()
            .then(authToken => fetchPostTypes(authToken))
            .then(posts => {
                sendResponse({action: 'fetchLanguagesResult', posts: posts});
            })
            .catch(error => {
                console.error('Error fetching languages:', error);
                sendResponse({action: 'fetchLanguagesResult', error: error});
            });
    }
    else if (message.action === 'fetchNoit') {
        getAuthToken()
            .then(authToken => fetchNoitTypes(authToken))
            .then(posts => {
                sendResponse({action: 'fetchNoitResult', posts: posts});
            })
            .catch(error => {
                console.error('Error fetching noit:', error);
                sendResponse({action: 'fetchNoitResult', error: error});
            });
    }
    else if (message.action === 'updateContactInfo') {
        globalContacts = message.contacts;
        sendResponse({success: true});
    }
    else if (message.action === 'fetchContacts') {
        getAuthToken()
            .then(authToken => {
                return fetchContacts(authToken);
            })
            .then(contacts => {
                sendResponse({action: 'fetchContactsResult', contacts: contacts});
            })
            .catch(error => {
                console.error('Error when fetching contacts:', error);
                sendResponse({action: 'fetchContactsResult', contacts: []});
            });
        return true;
    }
    if (message.action === 'getContactTypes') {
        getAuthToken()
            .then(fetchContactTypes)
            .then(contactTypes => {
                sendResponse({action: 'getContactTypesResult', contactTypes: contactTypes});
            })
            .catch(error => {
                console.error('Ошибка при получении типов контактов:', error);
                sendResponse({action: 'getContactTypesResult', contactTypes: []});
            });
    }
    if (message.action === 'fetchLanguageTypes') {
        getAuthToken()
            .then(authToken => fetchLanguageTypes(authToken))
            .then(posts => {
                sendResponse({action: 'fetchLanguageTypesResult', posts: posts});
            })
            .catch(error => {
                console.error('Error fetching languages:', error);
                sendResponse({action: 'fetchLanguageTypesResult', error: error});
            });
    }
    if (message.action === 'showRegion') {
        getAuthToken()
            .then(authToken => showRegion(authToken))
            .then(posts => {
                sendResponse({action: 'showRegionResult', posts: posts});
            })
            .catch(error => {
                console.error('Error fetching languages:', error);
                sendResponse({action: 'showRegionResult', error: error});
            });
    }
    if (message.action === 'showVac') {
        getAuthToken()
            .then(authToken => showVac(authToken))
            .then(posts => {
                sendResponse({action: 'showVacResult', posts: posts});
            })
            .catch(error => {
                console.error('Error fetching languages:', error);
                sendResponse({action: 'showVacResult', error: error});
            });
    }
    if (message.action === 'showVacStage') {
        getAuthToken()
            .then(authToken => showVacStage(authToken))
            .then(posts => {
                sendResponse({action: 'showVacStageResult', posts: posts});
            })
            .catch(error => {
                console.error('Error fetching languages:', error);
                sendResponse({action: 'showVacStageResult', error: error});
            });
    }
    if (message.action === 'saveVacancyId') {
        selectedVacancyId = message.vacancyId;
    }
    if (message.action === 'showTags') {
        getAuthToken()
            .then(authToken => showTags(authToken))
            .then(posts => {
                sendResponse({action: 'showTagsResult', posts: posts});
            })
            .catch(error => {
                console.error('Error fetching languages:', error);
                sendResponse({action: 'showTagsResult', error: error});
            });
    }
    if (message.action === 'openTab') {
        // chrome.tabs.create({ url: message.url }, async tab => {
        //     chrome.scripting.executeScript({
        //         target: { tabId: tab.id },
        //         files: ['otherContent.js']
        //     });
        //     try {
        //         await waitForTabLoad(tab.id);
        //         const html = await getTabHTML(tab.id);
        //         cachedHTML = html;
        //         sendResponse({html});
        //     } catch (err) {
        //         console.error(err);
        //     }
        // });
        //
        // setTimeout(() => {
        //     chrome.tabs.remove(tab.id);
        // }, 2000);
        // return true;
        const currentTabId = sender.tab.id; // Сохраняем ID текущей вкладки

        chrome.tabs.create({ url: message.url }, async tab => {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['otherContent.js']
            });
            try {
                await waitForTabLoad(tab.id);
                const html = await getTabHTML(tab.id);
                cachedHTML = html;
                sendResponse({ html });
            } catch (err) {
                console.error(err);
            }
            chrome.tabs.remove(tab.id, () => {
                chrome.tabs.update(currentTabId, { active: true });
            });
        });
        return true;
    }
    return true;
});
function waitForTabLoad(tabId) {
    return new Promise((resolve, reject) => {
        chrome.tabs.onUpdated.addListener(function listener (updatedTabId, info) {
            if (info.status === 'complete' && updatedTabId === tabId) {
                chrome.tabs.onUpdated.removeListener(listener);
                resolve();
            }
        });
    });
}
function getTabHTML(tabId) {
    return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, {action: 'getHTML'}, function(response) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError.message);
            } else {
                resolve(response.html);
            }
        });
    });
}
// async function getProfileHTML(url) {
//     return new Promise((resolve, reject) => { // Добавьте reject как аргумент
//         chrome.runtime.sendMessage({action: 'openTab', url: url}, function(response) {
//             if(response && response.html){
//                 resolve(response.html);
//             } else {
//                 console.error('Error: Response does not contain html property');
//                 reject("Response does not contain html property"); // Теперь вы можете отклонить обещание
//             }
//         });
//     });
// }
async function getAuthToken() {
    let response = await fetch('https://crm.ollsent.tech/wp-json/jwt-auth/v1/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: 'admin_3',
            password: 'AlexKozyrev280391'
        })
    });
    if (!response.ok) {
        throw new Error('Failed to get auth token');
    }
    let data = await response.json();
    return data.token;
}
async function saveCandidate(authToken, firstName, lastName, contacts = [], allInfo, foto, rezume, cvComb, candidateId = null) {
    let profileHTML = cachedHTML;
    let headers = new Headers();
    headers.append('Content-Type', 'application/json; charset=utf-8');
    headers.append('Authorization', 'Bearer ' + authToken);
    let candidate;
    let cvId = '';

    if(rezume && rezume.endsWith('.pdf')) {
        console.log('.pdf');
        let response_re = await fetch(rezume);
        let blobre = await response_re.blob();
        let formDatare = new FormData();
        formDatare.append('file', blobre, 'filename.pdf');
        let uploadResponsere = await fetch('https://crm.ollsent.tech/wp-json/wp/v2/media', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + authToken
            },
            body: formDatare
        });
        if (!uploadResponsere.ok) {
            throw new Error('Failed to upload file');
        }
        let uploadResultre = await uploadResponsere.json();
        cvId = uploadResultre.id;
    }
    // else if(rezume && rezume.endsWith('.docx')) {
    //     console.log('.docx');
    //     let response_re = await fetch(rezume);
    //     let blobre = await response_re.blob();
    //     let formDatare = new FormData();
    //     formDatare.append('file', blobre, 'filename.docx');
    //     let uploadResponsere = await fetch('https://crm.ollsent.tech/wp-json/wp/v2/media', {
    //         method: 'POST',
    //         headers: {
    //             'Authorization': 'Bearer ' + authToken
    //         },
    //         body: formDatare
    //     });
    //     if (!uploadResponsere.ok) {
    //         throw new Error('Failed to upload file');
    //     }
    //     let uploadResultre = await uploadResponsere.json();
    //     cvId = uploadResultre.id;
    // }
        else if (rezume && rezume.endsWith('.docx')) {
        console.log('.docx');
        try {
            let response_re = await fetch(rezume);
            if (!response_re.ok) {
                throw new Error('Failed to fetch resume');
            }
            let blobre = await response_re.blob();
            let formDatare = new FormData();
            formDatare.append('file', blobre, 'filename.docx');
            let uploadResponsere = await fetch('https://crm.ollsent.tech/wp-json/wp/v2/media', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + authToken
                },
                body: formDatare
            });
            if (!uploadResponsere.ok) {
                throw new Error('Failed to upload file');
            }
            let uploadResultre = await uploadResponsere.json();
            cvId = uploadResultre.id;
        } catch (error) {
            cvId = '';
            console.error(error);
        }
    }

    else {
        cvId = '';
    }
    console.log('cvId', cvId);
    let imageId = '';
    if (foto) {
        let response_r = await fetch(foto);
        let blob = await response_r.blob();
        let formData = new FormData();
        formData.append('file', blob, 'filename.jpg');
        let uploadResponse = await fetch('https://crm.ollsent.tech/wp-json/wp/v2/media', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + authToken
            },
            body: formData
        });
        if (!uploadResponse.ok) {
            throw new Error('Failed to upload image');
        }
        let uploadResult = await uploadResponse.json();
        imageId = uploadResult.id;
    }

    let emailContact = contacts.find(contact => contact.id === '8651');
    let lkdContact = contacts.find(contact => contact.id === '8655');
    let emailValue = emailContact ? emailContact.value : null;
    let lkdValue = lkdContact ? lkdContact.value : null;
    let now = new Date();
    let saveDatePa = now.getFullYear() + "-" +
        ("0" + (now.getMonth() + 1)).slice(-2) + "-" +
        ("0" + now.getDate()).slice(-2) + " " +
        ("0" + now.getHours()).slice(-2) + ":" +
        ("0" + now.getMinutes()).slice(-2) + ":" +
        ("0" + now.getSeconds()).slice(-2);
    let saveDate = saveDatePa.toString();
    let sec1 = new Date().getTime() / 1000;
    sec1 = sec1 + 86400;
    sec1 = Math.floor(sec1);
    let allInfoPar = '';
    if (allInfo === '') {
        allInfoPar = profileHTML;
    } else {
        allInfoPar = allInfo;
    }
    console.log(candidateId);
    if (candidateId) {
        let response = await fetch(`https://crm.ollsent.tech/wp-json/wp/v2/candidate/${candidateId}`, {
            method: 'GET',
            headers: headers
        });
        if (!response.ok) {
            throw new Error('Failed to fetch candidate');
        }
        let responseClone = response.clone();
        candidate = await response.json();
        let updateResponse = await fetch(`https://crm.ollsent.tech/wp-json/wp/v2/candidate/${candidateId}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify({
                title: lastName,
            })
        });
        if (!updateResponse.ok) {
            throw new Error('Failed to update candidate');
        }
        candidate = await responseClone.json();
        console.log('candidateId: ', candidateId);
        response = await fetch(`https://crm.ollsent.tech/wp-json/acf/v3/candidate/${candidate.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + authToken
            },
            body: JSON.stringify({
                fields: {
                    imya: firstName,
                    familiya: lastName,
                    kontakti22: contacts ? contacts.map(contact => ({
                        kontakt222: contact.id,
                        dannik: contact.value,
                        kanal_zvyazku: contact.kanal_zvyazku
                    })) : [],
                    email_r: emailValue,
                    lkd_r: lkdValue,
                    foto_re: imageId,
                    // resume_r: cvId ? cvId : '',
                    resume_docx: cvId ? cvId : '',
                    // code_cv: cvComb,
                    dattime: saveDate,
                    dataStart2: sec1,
                    dataStart0: sec1,
                    pdf_parsed: allInfoPar ? allInfoPar : '',
                    user_r: 8,
                    resume_r: cvId ? cvId : '',
                    code_cv: cvComb,
                    code_cv_dj: profileHTML
                }
            })
        });
        if (!response.ok) {
            throw new Error('Failed to update ACF fields');
        }
    } else {
        let response = await fetch('https://crm.ollsent.tech/wp-json/wp/v2/candidate', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                status: 'draft',
                title: lastName
            })
        });
        if (!response.ok) {
            let responseBody = await response.text();
            console.error(responseBody);
            throw new Error('Failed to create candidate');
        }
        candidate = await response.json();
        await new Promise(resolve => setTimeout(resolve, 6000));
        console.log('else candidateId: ', candidateId);
    }

    response = await fetch(`https://crm.ollsent.tech/wp-json/acf/v3/candidate/${candidate.id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
        },
        body: JSON.stringify({
            fields: {
                resume_r: cvId ? cvId : '',
                code_cv: cvComb,
                code_cv_dj: profileHTML
            }
        })
    });
    if (!response.ok) {
        let responseBody = await response.text();
        console.error(responseBody);
        throw new Error('Failed to create candidate');
    }
    await new Promise(resolve => setTimeout(resolve, 6000));
    // Then update status to 'publish'
    response = await fetch(`https://crm.ollsent.tech/wp-json/wp/v2/candidate/${candidate.id}`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            status: 'publish'
        })
    });

    if (!response.ok) {
        throw new Error('Failed to update candidate status');
    }

    response = await fetch(`https://crm.ollsent.tech/wp-json/acf/v3/candidate/${candidate.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
        },
        body: JSON.stringify({
            fields: {
                imya: firstName,
                familiya: lastName,
                kontakti22: contacts ? contacts.map(contact => ({
                    kontakt222: contact.id,
                    dannik: contact.value,
                    kanal_zvyazku: contact.kanal_zvyazku
                })) : [],
                email_r: emailValue,
                lkd_r: lkdValue,
                foto_re: imageId,
                // resume_r: cvId ? cvId : '',
                resume_docx: cvId ? cvId : '',
                // code_cv: cvComb,
                dattime: saveDate,
                dataStart2: sec1,
                dataStart0: sec1,
                pdf_parsed: allInfoPar ? allInfoPar : '',
                user_r: 8
            }
        })
    });
    if (!response.ok) {
        throw new Error('Failed to update ACF fields');
    }
    return candidate;
}
// async function checkCandidate(lastName, authToken) {
//     let response = await fetch('https://crm.ollsent.tech/wp-json/wp/v2/candidate?search=' + lastName, {
//         method: 'GET',
//         headers: {
//             'Content-Type': 'application/json',
//             'Authorization': 'Bearer ' + authToken
//         },
//     });
//     if (!response.ok) {
//         throw new Error('Failed to check candidate');
//     }
//     // const candidates = await response.json();
//     // return candidates.some(candidate => candidate.title.rendered === lastName);
//     const candidates = await response.json();
//     const foundCandidate = candidates.find(candidate => candidate.title.rendered === lastName);
//     return foundCandidate ? foundCandidate.id : null;
// }
// async function checkCandidate(lastName, emailValue, lkdValue,authToken) {
//     let url = `https://crm.ollsent.tech/wp-json/wp/v2/candidate?search=${lastName}`;
//     if (emailValue) {
//         url += `&email_r=${emailValue}`;
//     } if (lkdValue) {
//         url += `&lkd_r=${lkdValue}`;
//     }
//
//     let response = await fetch(url, {
//         method: 'GET',
//         headers: {
//             'Content-Type': 'application/json',
//             'Authorization': 'Bearer ' + authToken
//         },
//     });
//     console.log(response);
//     if (!response.ok) {
//         throw new Error('Failed to check candidate');
//     }
//     const candidates = await response.json();
//     const foundCandidate = candidates.find(candidate => candidate.title.rendered === lastName);
//     return foundCandidate ? foundCandidate.id : null;
// }
async function checkCandidate(lastName, authToken) {
    let response = await fetch('https://crm.ollsent.tech/wp-json/wp/v2/candidate?search=' + lastName, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
        },
    });
    if (!response.ok) {
        throw new Error('Failed to check candidate');
    }
    const candidates = await response.json();
    const foundCandidate = candidates.find(candidate => {
        console.log(candidate.title.rendered === lastName && (candidate.acf.lkd_r || candidate.acf.email_r));
        return candidate.title.rendered === lastName && (candidate.acf.lkd_r || candidate.acf.email_r);
    });
    return foundCandidate ? foundCandidate.id : null;
}

async function showVac(authToken) {
    let response = await fetch('https://crm.ollsent.tech/wp-json/wp/v2/vacancy', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch contact types');
    }

    const vacTypes = await response.json();
    return vacTypes;
}
async function showVacStage(authToken) {
    let vacancyId = selectedVacancyId ? selectedVacancyId : '';// ID вашей вакансии
    let response = await fetch(`https://crm.ollsent.tech/wp-json/wp/v2/vacancy/${vacancyId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch contact types');
    }

    const vacStTypes = await response.json();
    // return vacStTypes.acf.etapi_spivbesidi.map(item => item.label);

    return vacStTypes.acf.etapi_spivbesidi;
}
async function fetchPostTypes(authToken) {
    let postTypes = ['language'];
    let allPostsPromises = postTypes.map(postType => {
        return fetch(`https://crm.ollsent.tech/wp-json/wp/v2/${postType}?per_page=100`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + authToken
            }
        }).then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch posts');
            }
            return response.json();
        });
    });

    let allPosts = await Promise.all(allPostsPromises);
    return allPosts.flat();
}
async function fetchNoitTypes(authToken) {
    let postTypes = ['noitposts'];
    let allPostsPromises = postTypes.map(postType => {
        return fetch(`https://crm.ollsent.tech/wp-json/wp/v2/${postType}?per_page=100`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + authToken
            }
        }).then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch posts');
            }
            return response.json();
        });
    });

    let allPosts = await Promise.all(allPostsPromises);
    return allPosts.flat();
}
function fetchContacts(authToken) {
    const url = 'https://crm.ollsent.tech/wp-json/wp/v2/contacts';
    return fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
        }
    })
        .then(response => response.json())
        .then(data => {
            return data;
        })
        .catch(error => console.error('Error:', error));
}
async function fetchContactTypes(authToken) {
    let response = await fetch('https://crm.ollsent.tech/wp-json/wp/v2/contacts', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch contact types');
    }

    const contactTypes = await response.json();
    return contactTypes;
}
async function fetchLanguageTypes(authToken) {
    let response = await fetch('https://crm.ollsent.tech/wp-json/wp/v2/mova', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
        }
    });
    if (!response.ok) {
        throw new Error('Failed to fetch contact types');
    }
    const languageTypes = await response.json();
    return languageTypes;
}
async function showRegion(authToken) {
    let response = await fetch('https://crm.ollsent.tech/wp-json/wp/v2/countries?per_page=100', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch contact types');
    }

    const regTypes = await response.json();
    return regTypes;
}
async function showTags(authToken) {
    let response = await fetch('https://crm.ollsent.tech/wp-json/wp/v2/tagstype?per_page=100', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
        }
    });
    if (!response.ok) {
        throw new Error('Failed to fetch contact types');
    }
    const tagTypes = await response.json();
    return tagTypes;
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && /^http/.test(tab.url)) {
        chrome.tabs.sendMessage(tabId, {
            action: 'updateColor',
            url: tab.url
        })
    }
    // if (tab.url && isCandidatePage(tab.url) && !/\/contact-info\/$/.test(tab.url)) {
    //     console.log("Обновление данных расширения");
    //     updateExtensionData(tabId);
    // }
    // function isCandidatePage(url) {
    //     return url.includes("linkedin.com") ||
    //         url.includes("work.ua") ||
    //         url.includes("rabota.ua") ||
    //         url.includes("robota.ua") ||
    //         url.includes("djinni.co");
    // }
    //
    // async function updateExtensionData(tabId) {
    //     await chrome.tabs.sendMessage(tabId, { action: 'updateExtensionData' });
    //     console.log("Обновление данных расширения на странице кандидата");
    //     chrome.tabs.reload(tabId);
    // }
});

