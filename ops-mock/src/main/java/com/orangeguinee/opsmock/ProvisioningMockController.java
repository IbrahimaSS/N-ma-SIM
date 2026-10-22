package com.orangeguinee.opsmock;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedList;
import java.util.stream.Collectors;

/**
 * Mock de POST /ops/provisioning pour l'action CREATION_ACTIVATION_PREPAID_AUC_4G.
 * Rejoue les memes etapes que le vrai OPS (HLR, OCS, PCRF) et renvoie toujours un succes.
 */
@RestController
@RequestMapping("/ops")
public class ProvisioningMockController {

    static final String TYPE_ACTION = "ACTIVATION";

    @Value("${mock.login}")
    private String mockLogin;

    @Value("${mock.pass}")
    private String mockPass;

    private final NumeroRegistry numeroRegistry;

    public ProvisioningMockController(NumeroRegistry numeroRegistry) {
        this.numeroRegistry = numeroRegistry;
    }

    @PostMapping("/provisioning")
    public ResponseEntity<LogAction> provisioning(@RequestBody @Valid ProvisioningInput input,
                                                  @RequestParam("login") String login,
                                                  @RequestParam("pass") String pass) {
        if (!mockLogin.equals(login) || !mockPass.equals(pass)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new LogAction("1", "Invalid credentials", null));
        }
        if (!TYPE_ACTION.equals(input.getTypeAction())) {
            return ResponseEntity.badRequest()
                .body(new LogAction("1", "typeAction invalide : " + input.getTypeAction() + ". Utilisez " + TYPE_ACTION, null));
        }

        String doublon = numeroRegistry.enregistrer(input.getNumero(), input.getSim());
        if (doublon != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new LogAction("1", doublon, null));
        }

        LinkedList<String> responses = new LinkedList<>();
        // HLR (hlrcreationactivationaucRequests4G)
        if (input.getCle() != null && !input.getCle().isEmpty() && !"0".equals(input.getCle())) {
            responses.add("CreationImsiAUCHLRRequest : 0");
        }
        responses.add("CreationNumeroRequest : 0");
        responses.add("ActivationRequest : 0");
        responses.add("AjoutAPNRequest : 0");
        responses.add("ApnSupInfo4G : 0");
        responses.add("EpcBasic4GPrepaid : 0");
        responses.add("DoubleAppel2 : 0");
        // OCS (bcscreationNumeroPREPAIDRequests)
        responses.add("CREATION_NUMERO_PREPAID_OCS_REQUEST : 0");
        // PCRF
        responses.add("CREATION_NUMERO_PREPAID_UPFC_REQUEST : 0");

        return ResponseEntity.ok(new LogAction("0", "HLR : Success | OCS : Success | PCRF : Success", responses));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<LogAction> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
            .map(err -> err.getDefaultMessage())
            .collect(Collectors.joining(" | "));
        return ResponseEntity.badRequest().body(new LogAction("1", message, null));
    }
}
