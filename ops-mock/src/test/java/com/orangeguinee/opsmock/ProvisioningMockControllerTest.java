package com.orangeguinee.opsmock;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "mock.numeros.file=target/test-numeros-${random.uuid}.txt")
@AutoConfigureMockMvc
class ProvisioningMockControllerTest {

    @Autowired
    private MockMvc mvc;

    private static String body(String numero) {
        return body(numero, "611012" + numero, "5", "prepaid");
    }

    private static String body(String numero, String sim, String cle) {
        return body(numero, sim, cle, "prepaid");
    }

    private static String body(String numero, String sim, String cle, String profil) {
        return "{\"requestId\":\"109123\",\"typeAction\":\"ACTIVATION\",\"numero\":\"" + numero + "\","
            + "\"sim\":\"" + sim + "\",\"cle\":\"" + cle + "\",\"profil\":\"" + profil + "\"}";
    }

    @Test
    void retourneSucces() throws Exception {
        mvc.perform(post("/ops/provisioning?login=test&pass=test").contentType(MediaType.APPLICATION_JSON).content(body("620000001")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("0"))
            .andExpect(jsonPath("$.message").value("HLR : Success | OCS : Success | PCRF : Success"))
            .andExpect(jsonPath("$.responses.length()").value(9));
    }

    @Test
    void refuseNumeroDejaCree() throws Exception {
        mvc.perform(post("/ops/provisioning?login=test&pass=test").contentType(MediaType.APPLICATION_JSON).content(body("620000002")))
            .andExpect(status().isOk());
        mvc.perform(post("/ops/provisioning?login=test&pass=test").contentType(MediaType.APPLICATION_JSON).content(body("620000002")))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.status").value("1"))
            .andExpect(jsonPath("$.message").value("Le numero 620000002 existe deja"));
    }

    @Test
    void refuseMauvaisIdentifiants() throws Exception {
        mvc.perform(post("/ops/provisioning?login=x&pass=y").contentType(MediaType.APPLICATION_JSON).content(body("620000003")))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void refuseNumeroManquant() throws Exception {
        mvc.perform(post("/ops/provisioning?login=test&pass=test").contentType(MediaType.APPLICATION_JSON)
                .content("{\"requestId\":\"1\",\"typeAction\":\"ACTIVATION\",\"sim\":\"6110\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value("1"));
    }

    @Test
    void refuseNumeroPasDe9Caracteres() throws Exception {
        mvc.perform(post("/ops/provisioning?login=test&pass=test").contentType(MediaType.APPLICATION_JSON).content(body("62000000", "611012050000014", "5")))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Le numero doit contenir 9 caracteres"));
    }

    @Test
    void refuseSimPasDe15Caracteres() throws Exception {
        mvc.perform(post("/ops/provisioning?login=test&pass=test").contentType(MediaType.APPLICATION_JSON)
                .content(body("620000004", "61101205000001", "5")))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("La sim doit contenir 15 caracteres"));
    }

    @Test
    void refuseCleVide() throws Exception {
        mvc.perform(post("/ops/provisioning?login=test&pass=test").contentType(MediaType.APPLICATION_JSON)
                .content(body("620000005", "611012050000001", "")))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("La cle ne doit pas etre vide"));
    }

    @Test
    void accepteProfilPostpaid() throws Exception {
        mvc.perform(post("/ops/provisioning?login=test&pass=test").contentType(MediaType.APPLICATION_JSON)
                .content(body("620000006", "611012620000006", "5", "postpaid")))
            .andExpect(status().isOk());
    }

    @Test
    void refuseProfilInconnu() throws Exception {
        mvc.perform(post("/ops/provisioning?login=test&pass=test").contentType(MediaType.APPLICATION_JSON)
                .content(body("620000007", "611012050000001", "5", "hybride")))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Le profil doit etre prepaid ou postpaid"));
    }

    @Test
    void refuseProfilManquant() throws Exception {
        mvc.perform(post("/ops/provisioning?login=test&pass=test").contentType(MediaType.APPLICATION_JSON)
                .content("{\"requestId\":\"1\",\"typeAction\":\"ACTIVATION\",\"numero\":\"620000008\",\"sim\":\"611012050000001\",\"cle\":\"5\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Le profil est obligatoire"));
    }

    @Test
    void refuseSimDejaUtilisee() throws Exception {
        mvc.perform(post("/ops/provisioning?login=test&pass=test").contentType(MediaType.APPLICATION_JSON)
                .content(body("620000010", "611012050000010", "5")))
            .andExpect(status().isOk());
        mvc.perform(post("/ops/provisioning?login=test&pass=test").contentType(MediaType.APPLICATION_JSON)
                .content(body("620000011", "611012050000010", "5")))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.status").value("1"))
            .andExpect(jsonPath("$.message").value("La sim 611012050000010 est deja utilisee"));
    }

    @Test
    void refuseTypeActionInvalide() throws Exception {
        mvc.perform(post("/ops/provisioning?login=test&pass=test").contentType(MediaType.APPLICATION_JSON)
                .content(body("620000012").replace("\"ACTIVATION\"", "\"CREATION\"")))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value("1"))
            .andExpect(jsonPath("$.message").value("typeAction invalide : CREATION. Utilisez ACTIVATION"));
    }

    @Test
    void refuseTypeActionManquant() throws Exception {
        mvc.perform(post("/ops/provisioning?login=test&pass=test").contentType(MediaType.APPLICATION_JSON)
                .content(body("620000013").replace("\"typeAction\":\"ACTIVATION\",", "")))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Le typeAction doit etre defini. Utilisez ACTIVATION"));
    }
}
